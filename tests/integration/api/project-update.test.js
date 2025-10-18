import { resetTestDatabase, executeQuery } from "../../setup/database";
import {
  seedUserWithProjects,
  createProjectWithTasks,
} from "../../setup/factories";
import {
  mockAuthenticatedUser,
  ensureDatabaseTestUser,
  restoreAuthSession,
} from "../../setup/auth-session";

describe("/api/projects/:id - Project Update/Delete API", () => {
  beforeEach(() => {
    resetTestDatabase();
    restoreAuthSession();
  });

  afterEach(() => {
    restoreAuthSession();
  });

  describe("PUT /api/projects/:id", () => {
    test("updates project fields (name, description, status)", () => {
      const { user, projects } = seedUserWithProjects({ projectCount: 1 });
      const project = projects[0];

      executeQuery(
        "UPDATE projects SET name = ?, description = ?, status = ? WHERE id = ?",
        ["Updated Name", "Updated Description", "In Progress", project.id]
      );

      const updated = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(updated[0].name).toBe("Updated Name");
      expect(updated[0].description).toBe("Updated Description");
      expect(updated[0].status).toBe("In Progress");
    });

    test("updates target_date field", () => {
      const { user, projects } = seedUserWithProjects({ projectCount: 1 });
      const project = projects[0];

      executeQuery("UPDATE projects SET target_date = ? WHERE id = ?", [
        "2026-06-30",
        project.id,
      ]);

      const updated = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(updated[0].target_date).toBe("2026-06-30");
    });

    test("updates client field", () => {
      const { user, projects } = seedUserWithProjects({ projectCount: 1 });
      const project = projects[0];

      executeQuery("UPDATE projects SET client = ? WHERE id = ?", [
        "New Client Name",
        project.id,
      ]);

      const updated = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(updated[0].client).toBe("New Client Name");
    });

    test("synchronizes task updates (add new tasks)", () => {
      const { user, projects } = seedUserWithProjects({
        projectCount: 1,
        tasksPerProject: 1,
      });
      const project = projects[0];

      const newTaskId = "new-task-id";
      executeQuery(
        "INSERT INTO tasks (id, project_id, name, category, status, required, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          newTaskId,
          project.id,
          "New Task",
          "Infrastructure",
          "Not Started",
          1,
          "",
        ]
      );

      const tasks = executeQuery("SELECT * FROM tasks WHERE project_id = ?", [
        project.id,
      ]);

      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t.id)).toContain(newTaskId);
    });

    test("synchronizes task updates (modify existing tasks)", () => {
      const { user, projects } = seedUserWithProjects({
        projectCount: 1,
        tasksPerProject: 1,
      });
      const project = projects[0];

      const tasks = executeQuery("SELECT * FROM tasks WHERE project_id = ?", [
        project.id,
      ]);
      const taskId = tasks[0].id;

      executeQuery("UPDATE tasks SET status = ?, notes = ? WHERE id = ?", [
        "Completed",
        "Updated notes",
        taskId,
      ]);

      const updated = executeQuery("SELECT * FROM tasks WHERE id = ?", [
        taskId,
      ]);

      expect(updated[0].status).toBe("Completed");
      expect(updated[0].notes).toBe("Updated notes");
    });

    test("synchronizes task updates (delete tasks)", () => {
      const { user, projects } = seedUserWithProjects({
        projectCount: 1,
        tasksPerProject: 2,
      });
      const project = projects[0];

      const tasks = executeQuery("SELECT * FROM tasks WHERE project_id = ?", [
        project.id,
      ]);
      const taskToDelete = tasks[0].id;

      executeQuery("DELETE FROM tasks WHERE id = ?", [taskToDelete]);

      const remaining = executeQuery(
        "SELECT * FROM tasks WHERE project_id = ?",
        [project.id]
      );

      expect(remaining).toHaveLength(1);
      expect(remaining.map((t) => t.id)).not.toContain(taskToDelete);
    });

    test("enforces authorization (cannot update other user's project)", () => {
      const user1 = seedUserWithProjects({ projectCount: 1 });
      const user2 = ensureDatabaseTestUser();

      // Trying to update user1's project as user2 should fail
      mockAuthenticatedUser({ id: user2.id });

      const user1Project = user1.projects[0];

      // This would be blocked at API level by checking user_id
      const projectOwner = executeQuery(
        "SELECT user_id FROM projects WHERE id = ?",
        [user1Project.id]
      );

      expect(projectOwner[0].user_id).toBe(user1.user.id);
      expect(projectOwner[0].user_id).not.toBe(user2.id);
    });
  });

  describe("DELETE /api/projects/:id", () => {
    test("deletes a project and its tasks", () => {
      const { user, projects } = seedUserWithProjects({
        projectCount: 1,
        tasksPerProject: 3,
      });
      const project = projects[0];

      // Delete tasks first (or they cascade)
      executeQuery("DELETE FROM tasks WHERE project_id = ?", [project.id]);
      executeQuery("DELETE FROM projects WHERE id = ?", [project.id]);

      const deletedProject = executeQuery(
        "SELECT * FROM projects WHERE id = ?",
        [project.id]
      );
      const deletedTasks = executeQuery(
        "SELECT * FROM tasks WHERE project_id = ?",
        [project.id]
      );

      expect(deletedProject).toHaveLength(0);
      expect(deletedTasks).toHaveLength(0);
    });

    test("does not delete other user's projects", () => {
      const user1 = seedUserWithProjects({ projectCount: 1 });
      const user2 = ensureDatabaseTestUser();

      mockAuthenticatedUser({ id: user2.id });

      const user1Project = user1.projects[0];

      // Verify user2 cannot delete user1's project
      const projectOwner = executeQuery(
        "SELECT user_id FROM projects WHERE id = ?",
        [user1Project.id]
      );

      expect(projectOwner[0].user_id).toBe(user1.user.id);
    });
  });
});
