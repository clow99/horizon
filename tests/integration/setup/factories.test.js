import {
  buildProjectPayload,
  createProject,
  createProjectWithTasks,
  createUser,
  resetFactoryState,
  seedProjectWithTasks,
  seedUserWithProjects,
  fetchProjectWithTasks,
} from "../../setup/factories.js";
import {
  resetTestDatabase,
  truncateTables,
  executeQuery,
} from "../../setup/database.js";

describe("Factory helpers", () => {
  beforeEach(() => {
    resetFactoryState();
    resetTestDatabase();
    truncateTables();
  });

  test("createProjectWithTasks builds deterministic ids", () => {
    const { project, tasks } = createProjectWithTasks({}, [
      { name: "First" },
      { name: "Second" },
    ]);

    expect(project.id).toBe("project-0001");
    expect(tasks).toHaveLength(2);
    expect(tasks[0].project_id).toBe(project.id);
    expect(tasks[0].name).toBe("First");
    expect(tasks[1].name).toBe("Second");
  });

  test("buildProjectPayload produces payload-only structure", () => {
    const payload = buildProjectPayload({ taskCount: 2 });

    expect(payload).toMatchObject({
      name: expect.any(String),
      tasks: expect.any(Array),
    });
    expect(payload.tasks).toHaveLength(2);
    expect(payload.tasks[0]).not.toHaveProperty("id");
  });

  test("seedProjectWithTasks inserts project and tasks", () => {
    const { project, tasks } = seedProjectWithTasks({ taskCount: 2 });

    const projectsInDb = executeQuery("SELECT * FROM projects");
    const tasksInDb = executeQuery("SELECT * FROM tasks WHERE project_id = ?", [
      project.id,
    ]);

    expect(projectsInDb).toHaveLength(1);
    expect(tasksInDb).toHaveLength(2);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].project_id).toBe(project.id);
  });

  test("seedUserWithProjects inserts requested hierarchy", () => {
    const { user, projects } = seedUserWithProjects({
      projectCount: 2,
      tasksPerProject: 1,
    });

    expect(user.id).toBe("user-0001");
    expect(projects).toHaveLength(2);

    const dbProjects = executeQuery(
      "SELECT * FROM projects WHERE user_id = ?",
      [user.id]
    );
    expect(dbProjects).toHaveLength(2);

    const taskCount = executeQuery("SELECT COUNT(*) as total FROM tasks");
    expect(taskCount[0].total).toBe(2);
  });

  test("fetchProjectWithTasks returns nested rows", () => {
    const { project } = seedProjectWithTasks({ taskCount: 2 });
    const fetched = fetchProjectWithTasks(project.id);

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(project.id);
    expect(fetched.tasks).toHaveLength(2);
  });

  test("createUser produces deterministic identifier", () => {
    const user = createUser();
    expect(user.id).toBe("user-0001");
    expect(user.email).toBe("user-0001@example.com");
  });

  test("createProject inherits provided user id", () => {
    const user = createUser({ id: "user-9999" });
    const project = createProject({ user_id: user.id });
    expect(project.user_id).toBe("user-9999");
  });
});
