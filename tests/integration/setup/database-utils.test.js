import {
  resetTestDatabase,
  truncateTables,
  seedUser,
  seedProject,
  seedTask,
  executeQuery,
} from "../../setup/database";

describe("Database utility helpers", () => {
  beforeEach(() => {
    resetTestDatabase();
    truncateTables();
  });

  test("seed helpers insert deterministic records", () => {
    const user = seedUser();
    const project = seedProject({ user_id: user.id });
    const task = seedTask({ project_id: project.id });

    const users = executeQuery("SELECT * FROM users");
    const projects = executeQuery("SELECT * FROM projects");
    const tasks = executeQuery("SELECT * FROM tasks");

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(user.id);
    expect(users[0].email).toBe(user.email);

    expect(projects).toHaveLength(1);
    expect(projects[0].user_id).toBe(user.id);
    expect(projects[0].id).toBe(project.id);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].project_id).toBe(project.id);
    expect(tasks[0].id).toBe(task.id);
  });

  test("truncateTables clears all data and resets deterministic ids", () => {
    seedUser();
    seedProject();
    seedTask();

    truncateTables();

    const users = executeQuery("SELECT * FROM users");
    const projects = executeQuery("SELECT * FROM projects");
    const tasks = executeQuery("SELECT * FROM tasks");

    expect(users).toHaveLength(0);
    expect(projects).toHaveLength(0);
    expect(tasks).toHaveLength(0);

    const userAfterReset = seedUser();
    expect(userAfterReset.id).toBe("user-0001");
  });
});
