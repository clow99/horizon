import {
  createUser,
  createProject,
  createTask,
  resetFactoryState,
} from "../../../tests/setup/factories";
import { v4 as uuidv4 } from "uuid";

describe("Test Factories", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  describe("createUser", () => {
    test("should create user with default values", () => {
      const user = createUser();

      expect(user.id).toMatch(/^user-\d{4}$/);
      expect(user.email).toBe(`${user.id}@example.com`);
      expect(user.name).toBe(`User ${user.id}`);
    });

    test("should allow overrides", () => {
      const user = createUser({
        email: "custom@test.com",
        name: "Custom Name",
        id: "custom-id",
      });

      expect(user.email).toBe("custom@test.com");
      expect(user.name).toBe("Custom Name");
      expect(user.id).toBe("custom-id");
    });
  });

  describe("createProject", () => {
    test("should create project with default values", () => {
      const project = createProject();

      expect(project.id).toMatch(/^project-\d{4}$/);
      expect(project.user_id).toMatch(/^user-\d{4}$/);
      expect(project.name).toBe(`Project ${project.id}`);
      expect(project.status).toBe("Planning");
      expect(project.archived).toBe(0);
    });

    test("should allow overrides", () => {
      const userId = uuidv4();
      const project = createProject({
        user_id: userId,
        name: "Custom Project",
        status: "In Progress",
      });

      expect(project.user_id).toBe(userId);
      expect(project.name).toBe("Custom Project");
      expect(project.status).toBe("In Progress");
    });
  });

  describe("createTask", () => {
    test("should create task with default values", () => {
      const task = createTask();

      expect(task.id).toMatch(/^task-\d{4}$/);
      expect(task.project_id).toBeNull();
      expect(task.name).toBe(`Task ${task.id}`);
      expect(task.category).toBe("Infrastructure");
      expect(task).toHaveTaskStatus("Not Started");
      expect(task.required).toBe(1);
    });

    test("should allow overrides", () => {
      const projectId = uuidv4();
      const task = createTask({
        project_id: projectId,
        name: "Custom Task",
        status: "Completed",
        required: 0,
      });

      expect(task.project_id).toBe(projectId);
      expect(task.name).toBe("Custom Task");
      expect(task).toHaveTaskStatus("Completed");
      expect(task.required).toBe(0);
    });
  });
});
