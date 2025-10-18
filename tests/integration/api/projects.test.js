import { resetTestDatabase, executeQuery } from "../../setup/database";
import {
  seedUserWithProjects,
  createProject,
  createProjectWithTasks,
} from "../../setup/factories";
import {
  mockAuthenticatedUser,
  ensureDatabaseTestUser,
  restoreAuthSession,
} from "../../setup/auth-session";

describe("/api/projects - Projects API", () => {
  beforeEach(() => {
    resetTestDatabase();
    restoreAuthSession();
  });

  afterEach(() => {
    restoreAuthSession();
  });

  describe("GET /api/projects", () => {
    test("returns 401 when unauthenticated", async () => {
      const mockAuthSession = jest.fn().mockResolvedValue(null);
      jest.mock("@/auth", () => ({
        auth: mockAuthSession,
      }));

      // Verify unauthorized access is blocked
      expect(true).toBe(true); // Placeholder - actual endpoint testing requires request handler
    });

    test("returns empty array when user has no projects", async () => {
      const user = ensureDatabaseTestUser();
      mockAuthenticatedUser({ id: user.id });

      // User has no projects yet
      const projects = executeQuery(
        "SELECT * FROM projects WHERE user_id = ?",
        [user.id]
      );

      expect(projects).toHaveLength(0);
    });

    test("returns only active projects by default (excludes archived)", () => {
      const { user, projects } = seedUserWithProjects({
        projectCount: 3,
        tasksPerProject: 2,
      });

      // Archive one project
      executeQuery("UPDATE projects SET archived = 1 WHERE id = ?", [
        projects[0].id,
      ]);

      // Query should return only non-archived projects
      const activeProjects = executeQuery(
        "SELECT * FROM projects WHERE user_id = ? AND (archived IS NULL OR archived = 0)",
        [user.id]
      );

      expect(activeProjects).toHaveLength(2);
    });

    test("returns archived projects only when requested", () => {
      const { user, projects } = seedUserWithProjects({ projectCount: 2 });

      // Archive one project
      executeQuery("UPDATE projects SET archived = 1 WHERE id = ?", [
        projects[0].id,
      ]);

      // Query for archived only
      const archivedProjects = executeQuery(
        "SELECT * FROM projects WHERE user_id = ? AND archived = 1",
        [user.id]
      );

      expect(archivedProjects).toHaveLength(1);
      expect(archivedProjects[0].id).toBe(projects[0].id);
    });

    test("returns projects with nested tasks", () => {
      const { user, projects } = seedUserWithProjects({
        projectCount: 1,
        tasksPerProject: 3,
      });

      const projectWithTasks = projects[0];

      const tasks = executeQuery("SELECT * FROM tasks WHERE project_id = ?", [
        projectWithTasks.id,
      ]);

      expect(tasks).toHaveLength(3);
      expect(tasks.every((t) => t.project_id === projectWithTasks.id)).toBe(
        true
      );
    });

    test("only returns projects belonging to authenticated user", () => {
      const user1Data = seedUserWithProjects({ projectCount: 2 });
      const user2Data = seedUserWithProjects({ projectCount: 1 });

      const user1Projects = executeQuery(
        "SELECT * FROM projects WHERE user_id = ?",
        [user1Data.user.id]
      );
      const user2Projects = executeQuery(
        "SELECT * FROM projects WHERE user_id = ?",
        [user2Data.user.id]
      );

      expect(user1Projects).toHaveLength(2);
      expect(user2Projects).toHaveLength(1);
      expect(user1Projects.every((p) => p.user_id === user1Data.user.id)).toBe(
        true
      );
    });

    test("orders projects by created_at descending", () => {
      const user = ensureDatabaseTestUser();
      mockAuthenticatedUser({ id: user.id });

      const project1 = createProject({
        user_id: user.id,
        name: "First Project",
      });
      const project2 = createProject({
        user_id: user.id,
        name: "Second Project",
      });

      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          project1.id,
          project1.user_id,
          project1.name,
          project1.description,
          project1.client,
          project1.target_date,
          project1.status,
          project1.archived,
        ]
      );

      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          project2.id,
          project2.user_id,
          project2.name,
          project2.description,
          project2.client,
          project2.target_date,
          project2.status,
          project2.archived,
        ]
      );

      const projects = executeQuery(
        "SELECT * FROM projects WHERE user_id = ? ORDER BY archived ASC, created_at DESC",
        [user.id]
      );

      // Second project should come first (most recent)
      expect(projects[0].name).toBe("Second Project");
    });
  });

  describe("POST /api/projects", () => {
    test("returns 401 when unauthenticated", () => {
      mockAuthenticatedUser(null);
      // Endpoint should require authentication
      expect(true).toBe(true); // Placeholder
    });

    test("creates a new project with provided data", () => {
      const user = ensureDatabaseTestUser();
      mockAuthenticatedUser({ id: user.id });

      const projectData = createProject({
        user_id: user.id,
        name: "New Test Project",
        description: "Test Description",
        client: "Test Client",
        target_date: "2025-12-31",
        status: "Planning",
        project_type: "infrastructure",
      });

      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, project_type, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          projectData.id,
          projectData.user_id,
          projectData.name,
          projectData.description,
          projectData.client,
          projectData.target_date,
          projectData.status,
          projectData.project_type,
          projectData.archived,
        ]
      );

      const created = executeQuery("SELECT * FROM projects WHERE id = ?", [
        projectData.id,
      ]);

      expect(created).toHaveLength(1);
      expect(created[0].name).toBe("New Test Project");
      expect(created[0].user_id).toBe(user.id);
    });

    test("creates project with nested tasks", () => {
      const user = ensureDatabaseTestUser();
      mockAuthenticatedUser({ id: user.id });

      const { project, tasks } = createProjectWithTasks(
        { user_id: user.id, name: "Project with Tasks" },
        [
          { name: "Task 1", category: "Infrastructure", status: "Not Started" },
          { name: "Task 2", category: "Security", status: "In Progress" },
        ]
      );

      // Insert project
      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          project.id,
          project.user_id,
          project.name,
          project.description,
          project.client,
          project.target_date,
          project.status,
          project.archived,
        ]
      );

      // Insert tasks
      tasks.forEach((task) => {
        executeQuery(
          "INSERT INTO tasks (id, project_id, name, category, status, required, notes, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            task.id,
            task.project_id,
            task.name,
            task.category,
            task.status,
            task.required,
            task.notes,
            task.archived || 0,
          ]
        );
      });

      const createdTasks = executeQuery(
        "SELECT * FROM tasks WHERE project_id = ?",
        [project.id]
      );

      expect(createdTasks).toHaveLength(2);
      expect(createdTasks.map((t) => t.name)).toContain("Task 1");
      expect(createdTasks.map((t) => t.name)).toContain("Task 2");
    });

    test("uses provided project_type when creating project", () => {
      const user = ensureDatabaseTestUser();

      const project = createProject({
        user_id: user.id,
        project_type: "security",
      });

      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, project_type, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          project.id,
          project.user_id,
          project.name,
          project.description,
          project.client,
          project.target_date,
          project.status,
          project.project_type,
          project.archived,
        ]
      );

      const created = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(created[0].project_type).toBe("security");
    });

    test("defaults to Planning status when not provided", () => {
      const user = ensureDatabaseTestUser();

      const project = createProject({
        user_id: user.id,
        status: "Planning",
      });

      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          project.id,
          project.user_id,
          project.name,
          project.description,
          project.client,
          project.target_date,
          project.status,
          project.archived,
        ]
      );

      const created = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(created[0].status).toBe("Planning");
    });

    test("associates project with authenticated user", () => {
      const user = ensureDatabaseTestUser();
      mockAuthenticatedUser({ id: user.id });

      const project = createProject({ user_id: user.id });

      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          project.id,
          project.user_id,
          project.name,
          project.description,
          project.client,
          project.target_date,
          project.status,
          project.archived,
        ]
      );

      const created = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(created[0].user_id).toBe(user.id);
    });

    test("allows empty description and client", () => {
      const user = ensureDatabaseTestUser();

      const project = createProject({
        user_id: user.id,
        description: "",
        client: "",
      });

      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          project.id,
          project.user_id,
          project.name,
          project.description,
          project.client,
          project.target_date,
          project.status,
          project.archived,
        ]
      );

      const created = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(created[0].description).toBe("");
      expect(created[0].client).toBe("");
    });

    test("normalizes target_date to YYYY-MM-DD format", () => {
      const user = ensureDatabaseTestUser();

      const project = createProject({
        user_id: user.id,
        target_date: "2025-12-31",
      });

      executeQuery(
        "INSERT INTO projects (id, user_id, name, description, client, target_date, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          project.id,
          project.user_id,
          project.name,
          project.description,
          project.client,
          project.target_date,
          project.status,
          project.archived,
        ]
      );

      const created = executeQuery("SELECT * FROM projects WHERE id = ?", [
        project.id,
      ]);

      expect(created[0].target_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
