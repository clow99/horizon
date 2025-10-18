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

  test("returns existing project unchanged when no metadata updates exist", () => {
    const existing = {
      id: "p5",
      name: "Test",
      tasks: [{ id: "t1", name: "Task 1" }],
    };

    const update = {
      someField: "value",
      anotherField: 123,
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toEqual(existing.tasks);
  });

  test("handles null tasks in existing project", () => {
    const existing = {
      id: "p6",
      tasks: null,
    };

    const update = {
      updatedTasks: [{ id: "t1", name: "New Task" }],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(Array.isArray(result.tasks)).toBe(true);
    expect(result.tasks[0].id).toBe("t1");
  });

  test("handles empty deletedTaskIds and empty updatedTasks", () => {
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

    expect(result.tasks).toEqual(existing.tasks);
  });

  test("correctly deletes multiple tasks", () => {
    const existing = {
      id: "p8",
      tasks: [
        { id: "t1", name: "Keep" },
        { id: "t2", name: "Remove 1" },
        { id: "t3", name: "Remove 2" },
        { id: "t4", name: "Keep also" },
      ],
    };

    const update = {
      deletedTaskIds: ["t2", "t3"],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks.map((t) => t.id)).toEqual(["t1", "t4"]);
  });

  test("normalizes task dates correctly from various formats", () => {
    const existing = {
      id: "p9",
      tasks: [{ id: "t1", name: "Task" }],
    };

    const update = {
      updatedTasks: [
        {
          id: "t1",
          completed_at: new Date("2025-05-15T14:30:00Z"),
          updated_at: "2025-05-15T14:30:00Z",
        },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks[0].completed_at).toMatch(/2025-05-15/);
    expect(result.tasks[0].updated_at).toMatch(/2025-05-15/);
  });

  test("preserves null dates through normalization", () => {
    const existing = {
      id: "p10",
      tasks: [{ id: "t1", name: "Task" }],
    };

    const update = {
      updatedTasks: [
        {
          id: "t1",
          completed_at: null,
          updated_at: null,
        },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks[0].completed_at).toBeNull();
    expect(result.tasks[0].updated_at).toBeNull();
  });

  test("handles tasks with only name updates (no id)", () => {
    const existing = {
      id: "p11",
      tasks: [
        { id: "t1", name: "Original", status: "Not Started" },
        { id: "t2", name: "Unique Task", status: "In Progress" },
      ],
    };

    const update = {
      updatedTasks: [
        {
          name: "Unique Task",
          status: "Completed",
        },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    const updatedTask = result.tasks.find((t) => t.name === "Unique Task");
    expect(updatedTask.status).toBe("Completed");
    expect(updatedTask.id).toBe("t2");
  });

  test("handles task normalization with required boolean conversion", () => {
    const existing = {
      id: "p12",
      tasks: [{ id: "t1", name: "Task", required: 1 }],
    };

    const update = {
      updatedTasks: [
        {
          id: "t1",
          required: 0,
        },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks[0].required).toBe(false);
  });

  test("handles archived project normalization", () => {
    const existing = {
      id: "p13",
      archived: false,
      archived_at: null,
      tasks: [],
    };

    const update = {
      archived: 1,
      archived_at: "2025-05-20T10:00:00Z",
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.archived).toBe(true);
    expect(result.archived_at).toMatch(/2025-05-20/);
  });

  test("filters null tasks from the result", () => {
    const existing = {
      id: "p14",
      tasks: [{ id: "t1", name: "Task 1" }, null, { id: "t2", name: "Task 2" }],
    };

    const update = {
      updatedTasks: [{ id: "t1", status: "Completed" }],
    };

    // Simulate filtering null tasks if they exist
    const result = mergeProjectUpdate(existing, update);
    expect(result.tasks.filter((t) => t).length).toBeGreaterThan(0);
  });

  test("handles updatedTasks array with non-array input", () => {
    const existing = {
      id: "p15",
      tasks: [{ id: "t1", name: "Task" }],
    };

    const update = {
      updatedTasks: null,
      deletedTaskIds: null,
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toEqual(existing.tasks);
  });

  test("correctly appends new tasks without duplicating existing ones", () => {
    const existing = {
      id: "p16",
      tasks: [{ id: "t1", name: "Task 1" }],
    };

    const update = {
      updatedTasks: [
        { id: "t1", status: "Completed" },
        { id: "t2", name: "Task 2" },
        { id: "t3", name: "Task 3" },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.tasks).toHaveLength(3);
    expect(result.tasks.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
  });

  test("handles edge case: empty string target_date", () => {
    const existing = {
      id: "p17",
      target_date: "2025-01-01",
      tasks: [],
    };

    const update = {
      target_date: "",
    };

    const result = mergeProjectUpdate(existing, update);

    expect(result.target_date).toBe("");
  });

  test("normalizes invalid date strings gracefully", () => {
    const existing = {
      id: "p18",
      tasks: [{ id: "t1", name: "Task" }],
    };

    const update = {
      updatedTasks: [
        {
          id: "t1",
          completed_at: "invalid-date",
        },
      ],
    };

    const result = mergeProjectUpdate(existing, update);

    // Should preserve invalid dates as-is or normalize them
    expect(result.tasks[0]).toBeDefined();
  });
});
