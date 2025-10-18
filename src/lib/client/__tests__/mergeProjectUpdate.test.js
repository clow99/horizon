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
});
