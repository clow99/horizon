import { v4 as uuidv4 } from "uuid";
import { insertTestData, executeQuery } from "./database.js";

let counters = {
  user: 0,
  project: 0,
  task: 0,
};

export function resetFactoryState() {
  counters = {
    user: 0,
    project: 0,
    task: 0,
  };
}

function padId(num) {
  return String(num).padStart(4, "0");
}

export function createUser(overrides = {}) {
  counters.user++;
  const id = overrides.id || `user-${padId(counters.user)}`;
  const email = overrides.email || `${id}@example.com`;
  const name = overrides.name || `User ${id}`;

  return {
    id,
    email,
    name,
    image: overrides.image || null,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

export function createProject(overrides = {}) {
  counters.project++;
  const id = overrides.id || `project-${padId(counters.project)}`;
  const userId = overrides.user_id || `user-${padId(counters.user || 1)}`;

  return {
    id,
    user_id: userId,
    name: overrides.name !== undefined ? overrides.name : `Project ${id}`,
    status: overrides.status || "Planning",
    target_date: overrides.target_date || null,
    archived: overrides.archived !== undefined ? overrides.archived : 0,
    display_order:
      overrides.display_order !== undefined ? overrides.display_order : 0,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

export function createTask(overrides = {}) {
  counters.task++;
  const id = overrides.id || `task-${padId(counters.task)}`;

  return {
    id,
    project_id:
      overrides.project_id !== undefined ? overrides.project_id : null,
    name: overrides.name || `Task ${id}`,
    description: overrides.description || "",
    category: overrides.category || "Infrastructure",
    status: overrides.status || "Not Started",
    required: overrides.required !== undefined ? overrides.required : 1,
    notes: overrides.notes || "",
    completed_at: overrides.completed_at || null,
    updated_by_user_id: overrides.updated_by_user_id || null,
    updated_by_user_name: overrides.updated_by_user_name || null,
    updated_by_user_image: overrides.updated_by_user_image || null,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

export function createProjectWithTasks(projectOverrides = {}, taskDefs = []) {
  const project = createProject(projectOverrides);
  const tasks = taskDefs.map((taskDef) =>
    createTask({ ...taskDef, project_id: project.id })
  );

  return { project, tasks };
}

export function buildProjectPayload(opts = {}) {
  const taskCount = opts.taskCount || 0;
  const tasks = [];

  for (let i = 0; i < taskCount; i++) {
    tasks.push({
      name: opts.taskName || `Task ${i + 1}`,
      description: opts.taskDescription || "",
      category: opts.taskCategory || "Infrastructure",
      status: opts.taskStatus || "Not Started",
      required: opts.taskRequired !== undefined ? opts.taskRequired : true,
    });
  }

  return {
    name: opts.name || "Test Project",
    tasks,
  };
}

export function seedProjectWithTasks(opts = {}) {
  const taskCount = opts.taskCount || 0;
  const { project, tasks } = createProjectWithTasks(
    opts.projectOverrides || {},
    Array.from({ length: taskCount }, (_, i) => ({
      name: `Task ${i + 1}`,
    }))
  );

  // Insert user if needed
  if (!opts.skipUserInsert) {
    const user = createUser({ id: project.user_id });
    insertTestData("users", user);
  }

  // Insert project and tasks
  insertTestData("projects", project);
  tasks.forEach((task) => insertTestData("tasks", task));

  return { project, tasks };
}

export function seedUserWithProjects(opts = {}) {
  const projectCount = opts.projectCount || 1;
  const tasksPerProject = opts.tasksPerProject || 0;

  const user = createUser(opts.userOverrides || {});
  insertTestData("users", user);

  const projects = [];
  for (let i = 0; i < projectCount; i++) {
    const { project, tasks } = createProjectWithTasks(
      { user_id: user.id, ...opts.projectOverrides },
      Array.from({ length: tasksPerProject }, (_, j) => ({
        name: `Project ${i + 1} Task ${j + 1}`,
      }))
    );

    insertTestData("projects", project);
    tasks.forEach((task) => insertTestData("tasks", task));
    projects.push(project);
  }

  return { user, projects };
}

export function fetchProjectWithTasks(projectId) {
  const projectRows = executeQuery("SELECT * FROM projects WHERE id = ?", [
    projectId,
  ]);

  if (!projectRows || projectRows.length === 0) {
    return null;
  }

  const project = projectRows[0];
  const taskRows = executeQuery(
    "SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at",
    [projectId]
  );

  project.tasks = taskRows || [];
  return project;
}
