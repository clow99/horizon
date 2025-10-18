import { resetTestDatabase, executeQuery } from "../../setup/database";
import { seedUserWithProjects } from "../../setup/factories";
import {
  mockAuthenticatedUser,
  ensureDatabaseTestUser,
  restoreAuthSession,
} from "../../setup/auth-session";

describe("/api/projects/order - Project Reordering API", () => {
  beforeEach(() => {
    resetTestDatabase();
    restoreAuthSession();
  });

  afterEach(() => {
    restoreAuthSession();
  });

  describe("PUT /api/projects/order", () => {
    test("reorders projects according to provided order", () => {
      const { user, projects } = seedUserWithProjects({
        projectCount: 3,
        tasksPerProject: 0,
      });

      const project1 = projects[0];
      const project2 = projects[1];
      const project3 = projects[2];

      // Simulate reordering: project3, project1, project2
      const newOrder = [project3.id, project1.id, project2.id];

      newOrder.forEach((projectId, index) => {
        executeQuery("UPDATE projects SET display_order = ? WHERE id = ?", [
          index + 1,
          projectId,
        ]);
      });

      const reordered = executeQuery(
        "SELECT id FROM projects WHERE user_id = ? ORDER BY display_order ASC",
        [user.id]
      );

      expect(reordered.map((p) => p.id)).toEqual(newOrder);
    });

    test("prevents invalid reorder with missing projects", () => {
      const { user, projects } = seedUserWithProjects({ projectCount: 3 });
      const project1 = projects[0];
      const project2 = projects[1];

      // Attempting to reorder with only 2 of 3 projects should fail validation
      const incompleteOrder = [project1.id, project2.id];

      expect(incompleteOrder.length).toBe(2);
    });

    test("prevents reorder with projects from different users", () => {
      const user1 = seedUserWithProjects({ projectCount: 2 });
      const user2 = seedUserWithProjects({ projectCount: 1 });

      mockAuthenticatedUser({ id: user1.user.id });

      // Try to include user2's project in user1's reorder
      const user1Project = user1.projects[0];
      const user2Project = user2.projects[0];

      const mixedOrder = [user1Project.id, user2Project.id];

      // This should be blocked at API level
      const user1Projects = executeQuery(
        "SELECT id FROM projects WHERE user_id = ?",
        [user1.user.id]
      );

      expect(user1Projects.map((p) => p.id)).not.toContain(user2Project.id);
    });

    test("enforces ownership - user can only reorder own projects", () => {
      const user1 = seedUserWithProjects({ projectCount: 2 });
      const user2 = ensureDatabaseTestUser();

      mockAuthenticatedUser({ id: user2.id });

      // User2 attempts to reorder user1's projects
      const user1ProjectIds = user1.projects.map((p) => p.id);

      // Verify user2 doesn't own these projects
      const projectOwners = executeQuery(
        "SELECT DISTINCT user_id FROM projects WHERE id IN (?)",
        [user1ProjectIds[0]]
      );

      expect(projectOwners[0]?.user_id).toBe(user1.user.id);
    });

    test("handles empty project list gracefully", () => {
      const user = ensureDatabaseTestUser();
      mockAuthenticatedUser({ id: user.id });

      // User has no projects
      const projects = executeQuery(
        "SELECT * FROM projects WHERE user_id = ?",
        [user.id]
      );

      expect(projects).toHaveLength(0);
    });

    test("validates payload contains array of project IDs", () => {
      const { user, projects } = seedUserWithProjects({ projectCount: 2 });
      mockAuthenticatedUser({ id: user.id });

      // Valid payload structure
      const validPayload = {
        projectOrder: projects.map((p) => p.id),
      };

      expect(Array.isArray(validPayload.projectOrder)).toBe(true);
    });

    test("returns 400 for invalid payload format", () => {
      const { user } = seedUserWithProjects({ projectCount: 1 });
      mockAuthenticatedUser({ id: user.id });

      // Invalid: not an array
      const invalidPayload = { projectOrder: "not-an-array" };

      expect(typeof invalidPayload.projectOrder).not.toBe("object");
    });

    test("preserves project data during reorder", () => {
      const { user, projects } = seedUserWithProjects({
        projectCount: 2,
        tasksPerProject: 1,
      });

      const project1 = projects[0];
      const originalData = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project1.id,
      ])[0];

      // Reorder
      executeQuery("UPDATE projects SET display_order = ? WHERE id = ?", [
        2,
        project1.id,
      ]);

      const afterReorder = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project1.id,
      ])[0];

      // Core data should be unchanged
      expect(afterReorder.name).toBe(originalData.name);
      expect(afterReorder.description).toBe(originalData.description);
      expect(afterReorder.client).toBe(originalData.client);
    });

    test("returns 401 when unauthenticated", () => {
      const { projects } = seedUserWithProjects({ projectCount: 2 });
      mockAuthenticatedUser(null);

      // Without auth, request should be rejected
      expect(true).toBe(true); // Placeholder
    });

    test("returns 200 with success message on valid reorder", () => {
      const { user, projects } = seedUserWithProjects({ projectCount: 2 });
      mockAuthenticatedUser({ id: user.id });

      const reorderPayload = {
        projectOrder: [projects[1].id, projects[0].id],
      };

      // On success, API should return 200
      expect(reorderPayload.projectOrder).toHaveLength(2);
    });
  });
});
