import { resetTestDatabase, insertTestData } from "../../setup/database";
import { createUser, createProject } from "../../setup/factories";
import { query } from "@/lib/db";

describe("Database Integration", () => {
  beforeEach(() => {
    // Reset database before each test
    resetTestDatabase();
  });

  describe("User operations", () => {
    test("should insert and retrieve user", async () => {
      const user = createUser({ email: "test@example.com" });

      // Insert user
      insertTestData("users", user);

      // Retrieve user
      const results = await query("SELECT * FROM users WHERE email = ?", [
        user.email,
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(user.id);
      expect(results[0].email).toBe("test@example.com");
    });

    test("should enforce unique email constraint", async () => {
      const user1 = createUser({ email: "same@example.com" });
      const user2 = createUser({
        id: "different-id",
        email: "same@example.com",
      });

      insertTestData("users", user1);

      // Second insert with same email should fail
      expect(() => {
        insertTestData("users", user2);
      }).toThrow();
    });
  });

  describe("Project operations", () => {
    test("should insert and retrieve project", async () => {
      // First create user
      const user = createUser();
      insertTestData("users", user);

      // Then create project
      const project = createProject({ user_id: user.id });
      insertTestData("projects", project);

      // Retrieve project
      const results = await query("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Project");
      expect(results[0].user_id).toBe(user.id);
    });

    test("should filter projects by user_id", async () => {
      const user1 = createUser({ email: "user1@test.com" });
      const user2 = createUser({ email: "user2@test.com" });

      insertTestData("users", user1);
      insertTestData("users", user2);

      const project1 = createProject({
        user_id: user1.id,
        name: "User 1 Project",
      });
      const project2 = createProject({
        user_id: user2.id,
        name: "User 2 Project",
      });

      insertTestData("projects", project1);
      insertTestData("projects", project2);

      // Query only user1's projects
      const results = await query("SELECT * FROM projects WHERE user_id = ?", [
        user1.id,
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("User 1 Project");
    });
  });

  describe("Task operations", () => {
    test("should create task linked to project", async () => {
      // Setup user and project
      const user = createUser();
      const project = createProject({ user_id: user.id });

      insertTestData("users", user);
      insertTestData("projects", project);

      // Create task
      const task = {
        id: "task-1",
        project_id: project.id,
        name: "Test Task",
        category: "Testing",
        status: "Not Started",
        required: 1,
        notes: "",
        completed_at: null,
        updated_by_user_id: null,
        updated_by_user_name: null,
        updated_by_user_image: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      insertTestData("tasks", task);

      // Retrieve task
      const results = await query("SELECT * FROM tasks WHERE project_id = ?", [
        project.id,
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Task");
    });
  });
});
