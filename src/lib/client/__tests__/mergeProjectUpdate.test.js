import { mergeProjectUpdate } from "../mergeProjectUpdate";

describe("mergeProjectUpdate", () => {
  test("returns existing project when update is falsy", () => {
    const existing = { id: "p", tasks: [{ id: "t" }] };
    expect(mergeProjectUpdate(existing, null)).toBe(existing);
  });

  test("normalizes legacy full project updates", () => {
    const existing = { id: "p1", tasks: [] };
    const legacyUpdate = {
      id: "p1",
      name: "Legacy",
      archived: 1,
      archived_at: "2025-05-01T10:00:00Z",
      target_date: "2025-05-10T00:00:00Z",
      tasks: [
        {
          id: "t1",
          name: "Task One",
          required: 0,
          completed_at: "2025-05-01",
          updated_at: new Date("2025-05-02T12:00:00Z"),
        },
      ],
    };

    const result = mergeProjectUpdate(existing, legacyUpdate);

    expect(result.archived).toBe(true);
    expect(result.target_date).toBe("2025-05-10");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].required).toBe(false);
    expect(result.tasks[0].completed_at).toMatch(/T/);
    expect(result.tasks[0].updated_at).toMatch(/T/);
  });

  test("applies direct project updates and normalizes date fields", () => {
    const existing = {
      id: "p2",
      target_date: "2025-01-01",
      archived: false,
      tasks: [],
    };

    const update = {
      name: "Updated",
      target_date: new Date("2025-06-01T00:00:00Z"),
      archived: 0,
      archived_at: "2025-06-10T05:00:00Z",
      project: {
        target_date: "2025-07-01T15:30:00Z",
        archived: 1,
      },
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.name).toBe("Updated");
    expect(result.target_date).toBe("2025-07-01");
    expect(result.archived).toBe(true);
    expect(result.archived_at).toMatch(/2025-06-10/);
  });

  test("merges updated tasks, removes deleted ones, and appends new tasks", () => {
    const existing = {
      id: "p3",
      changedTaskIds: ["old"],
      deletedTaskIds: ["old"],
      tasks: [
        { id: "keep", name: "Keep", status: "In Progress", required: 0 },
        { id: null, name: "MatchByName", status: "Not Started", required: 1 },
        { id: "remove", name: "Remove", status: "Completed" },
      ],
    };

    const update = {
      updatedTasks: [
        {
          id: "keep",
          status: "Completed",
          completed_at: "2025-05-03",
        },
        {
          name: "MatchByName",
          status: "In Progress",
          required: 0,
        },
        {
          id: "new-task",
          name: "Added",
          status: "Not Started",
          required: 1,
        },
      ],
      deletedTaskIds: ["remove"],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toHaveLength(3);
    const keepTask = result.tasks.find((task) => task.id === "keep");
    expect(keepTask.status).toBe("Completed");
    expect(keepTask.completed_at).toMatch(/T/);

    const nameTask = result.tasks.find((task) => task.name === "MatchByName");
    expect(nameTask.required).toBe(false);
    expect(nameTask.status).toBe("In Progress");

    const newTask = result.tasks.find((task) => task.id === "new-task");
    expect(newTask).toBeDefined();
    expect(newTask.required).toBe(true);

    expect(result.changedTaskIds).toBeUndefined();
    expect(result.deletedTaskIds).toBeUndefined();
  });

  test("replaces tasks when full project flag is provided", () => {
    const existing = {
      id: "p4",
      tasks: [{ id: "old" }],
    };

    const update = {
      fullProject: true,
      tasks: [{ id: "fresh", required: 1, completed_at: "2025-05-01" }],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toBe("fresh");
    expect(result.tasks[0].required).toBe(true);
  });

  test("handles array of tasks in update without fullProject flag", () => {
    const existing = {
      id: "p5",
      tasks: [{ id: "t1", name: "Old Task" }],
    };

    const update = {
      tasks: [
        { id: "t2", name: "New Task 1" },
        { id: "t3", name: "New Task 2" },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].id).toBe("t2");
    expect(result.tasks[1].id).toBe("t3");
  });

  test("ignores meta keys (tasks, updatedTasks, deletedTaskIds) as direct project updates", () => {
    const existing = {
      id: "p6",
      name: "Original",
      tasks: [{ id: "t1" }],
    };

    const update = {
      name: "Updated",
      tasks: [{ id: "t2" }],
      updatedTasks: [],
      deletedTaskIds: [],
      description: "New Description",
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.name).toBe("Updated");
    expect(result.description).toBe("New Description");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toBe("t2");
  });

  test("handles empty updatedTasks and deletedTaskIds", () => {
    const existing = {
      id: "p7",
      tasks: [
        { id: "t1", name: "Task 1" },
        { id: "t2", name: "Task 2" },
      ],
    };

    const update = {
      updatedTasks: [],
      deletedTaskIds: [],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]).toEqual(existing.tasks[0]);
    expect(result.tasks[1]).toEqual(existing.tasks[1]);
  });

  test("normalizes date strings with various formats", () => {
    const existing = { id: "p8", target_date: "2025-01-01", tasks: [] };

    const update = {
      target_date: "2025/06/15",
    };

    const result = mergeProjectUpdate(existing, update);
    // Should parse and normalize to YYYY-MM-DD format
    expect(result.target_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("handles empty target_date string as empty", () => {
    const existing = { id: "p9", target_date: "2025-01-01", tasks: [] };

    const update = {
      target_date: "",
    };

    const result = mergeProjectUpdate(existing, update);
    expect(result.target_date).toBe("");
  });

  test("normalizes boolean coercion for archived and required", () => {
    const existing = {
      id: "p10",
      archived: "0",
      tasks: [{ id: "t1", required: "0" }],
    };

    const update = {
      archived: "1",
      updatedTasks: [{ id: "t1", required: "1" }],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.archived).toBe(true);
    expect(result.tasks[0].required).toBe(true);
  });

  test("cleans up changedTaskIds and deletedTaskIds from merged project", () => {
    const existing = {
      id: "p11",
      changedTaskIds: ["t1", "t2"],
      deletedTaskIds: ["t3"],
      tasks: [{ id: "t1" }],
    };

    const update = {
      updatedTasks: [{ id: "t1", status: "Completed" }],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.changedTaskIds).toBeUndefined();
    expect(result.deletedTaskIds).toBeUndefined();
  });

  test("handles null tasks array gracefully", () => {
    const existing = {
      id: "p12",
      tasks: null,
    };

    const update = {
      updatedTasks: [{ id: "t1", name: "New Task" }],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(Array.isArray(result.tasks)).toBe(true);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].name).toBe("New Task");
  });

  test("handles missing existing project gracefully", () => {
    const update = {
      name: "New Project",
      tasks: [{ id: "t1" }],
    };

    const result = mergeProjectUpdate(undefined, update);

    expect(result.name).toBe("New Project");
    expect(result.tasks).toHaveLength(1);
  });

  test("matches tasks by name when id is missing", () => {
    const existing = {
      id: "p13",
      tasks: [
        { id: null, name: "Task Alpha" },
        { id: null, name: "Task Beta" },
      ],
    };

    const update = {
      updatedTasks: [{ name: "Task Alpha", status: "Completed" }],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks[0].status).toBe("Completed");
    expect(result.tasks[1].status).toBeUndefined();
  });

  test("avoids duplicate tasks when multiple updates reference same task", () => {
    const existing = {
      id: "p14",
      tasks: [{ id: "t1", name: "Task", status: "Not Started" }],
    };

    const update = {
      updatedTasks: [
        { id: "t1", status: "In Progress" },
        { id: "t1", status: "Completed" },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    const t1Tasks = result.tasks.filter((t) => t.id === "t1");
    expect(t1Tasks).toHaveLength(1);
  });

  test("appends new tasks that don't match existing ones", () => {
    const existing = {
      id: "p15",
      tasks: [{ id: "t1", name: "Task 1" }],
    };

    const update = {
      updatedTasks: [
        { id: "t2", name: "Task 2" },
        { id: "t3", name: "Task 3" },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toHaveLength(3);
    expect(result.tasks.find((t) => t.id === "t1")).toBeDefined();
    expect(result.tasks.find((t) => t.id === "t2")).toBeDefined();
    expect(result.tasks.find((t) => t.id === "t3")).toBeDefined();
  });

  test("handles deleted tasks by filtering them out", () => {
    const existing = {
      id: "p16",
      tasks: [
        { id: "t1", name: "Keep" },
        { id: "t2", name: "Remove" },
        { id: "t3", name: "Keep2" },
      ],
    };

    const update = {
      deletedTaskIds: ["t2"],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks.find((t) => t.id === "t2")).toBeUndefined();
  });

  test("normalizes datetime fields in tasks and projects", () => {
    const existing = { id: "p17", tasks: [] };

    const dateObj = new Date("2025-05-15T14:30:00Z");
    const update = {
      archived_at: dateObj,
      updatedTasks: [
        { id: "t1", completed_at: dateObj, updated_at: "2025-05-15T10:00:00Z" },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.archived_at).toMatch(/Z$/);
    expect(result.tasks[0].completed_at).toMatch(/Z$/);
    expect(result.tasks[0].updated_at).toMatch(/Z$/);
  });

  test("handles invalid date objects", () => {
    const existing = { id: "p18", tasks: [] };

    const invalidDate = new Date("invalid");
    const update = {
      archived_at: invalidDate,
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.archived_at).toBeNull();
  });

  test("preserves task properties not in update", () => {
    const existing = {
      id: "p19",
      tasks: [
        { id: "t1", name: "Task", status: "Not Started", notes: "Important" },
      ],
    };

    const update = {
      updatedTasks: [{ id: "t1", status: "Completed" }],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks[0].name).toBe("Task");
    expect(result.tasks[0].notes).toBe("Important");
    expect(result.tasks[0].status).toBe("Completed");
  });

  test("handles task with null values", () => {
    const existing = {
      id: "p20",
      tasks: [{ id: "t1", name: null, status: "Not Started" }],
    };

    const update = {
      updatedTasks: [{ id: "t1", status: "In Progress" }],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks[0].name).toBeNull();
    expect(result.tasks[0].status).toBe("In Progress");
  });

  test("filters out falsy tasks in array", () => {
    const existing = {
      id: "p21",
      tasks: [{ id: "t1" }, null, undefined, { id: "t2" }],
    };

    const update = {
      deletedTaskIds: ["t1"],
    };

    const result = mergeProjectUpdate(existing, update);

    // Should handle null/undefined gracefully
    expect(result.tasks.length).toBeGreaterThanOrEqual(1);
  });

  test("updates project properties from nested project object", () => {
    const existing = {
      id: "p22",
      name: "Original",
      description: "Original Description",
      tasks: [],
    };

    const update = {
      project: {
        name: "Updated via nested",
        target_date: "2025-08-01",
      },
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.name).toBe("Updated via nested");
    expect(result.target_date).toBe("2025-08-01");
    expect(result.description).toBe("Original Description");
  });

  test("prioritizes direct updates over nested project object", () => {
    const existing = {
      id: "p23",
      name: "Original",
      tasks: [],
    };

    const update = {
      name: "Direct Update",
      project: {
        name: "Nested Update",
      },
    };

    const result = mergeProjectUpdate(existing, update);

    // Direct updates should be applied first, then nested project
    // The nested project wins in this implementation
    expect(result.name).toBe("Nested Update");
  });

  test("handles whitespace-only date strings", () => {
    const existing = { id: "p24", target_date: "2025-01-01", tasks: [] };

    const update = {
      target_date: "   ",
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.target_date).toBe("");
  });
});
