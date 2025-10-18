import { seedUser, seedProject, seedTask, executeQuery } from "./database.js";

let factoryCounter = 0;
const FACTORY_BASE_DATE = Date.UTC(2025, 0, 1, 0, 0, 0, 0);

function nextFactoryId(prefix) {
  factoryCounter += 1;
  return `${prefix}-${factoryCounter.toString().padStart(4, "0")}`;
}

function factoryTimestamp(offsetMinutes = factoryCounter) {
  return new Date(FACTORY_BASE_DATE + offsetMinutes * 60000).toISOString();
}

export function resetFactoryState() {
  factoryCounter = 0;
}

export function createUser(overrides = {}) {
  const id = overrides.id || nextFactoryId("user");
  const createdAt = overrides.created_at || factoryTimestamp();

  return {
    id,
    email: overrides.email || `${id}@example.com`,
    name: overrides.name || `User ${id}`,
    image: overrides.image ?? null,
    created_at: createdAt,
    updated_at: overrides.updated_at || createdAt,
    ...overrides,
  };
}

export function createTask(overrides = {}) {
  const id = overrides.id || nextFactoryId("task");
  const createdAt = overrides.created_at || factoryTimestamp();

  return {
    id,
    project_id: overrides.project_id || null,
    name: overrides.name || `Task ${id}`,
    category: overrides.category || "Infrastructure",
    status: overrides.status || "Not Started",
    required: overrides.required ?? 1,
    notes: overrides.notes || "",
    completed_at: overrides.completed_at || null,
    updated_by_user_id: overrides.updated_by_user_id || null,
    updated_by_user_name: overrides.updated_by_user_name || null,
    updated_by_user_image: overrides.updated_by_user_image || null,
    created_at: createdAt,
    updated_at: overrides.updated_at || createdAt,
    ...overrides,
  };
}

export function createProject(overrides = {}) {
  const id = overrides.id || nextFactoryId("project");
  const createdAt = overrides.created_at || factoryTimestamp();

  return {
    id,
    user_id: overrides.user_id || nextFactoryId("user"),
    name: overrides.name || `Project ${id}`,
    description: overrides.description || "Factory project description",
    client: overrides.client || "Factory Client",
    target_date: overrides.target_date || "2025-12-31",
    status: overrides.status || "Planning",
    archived: overrides.archived ?? 0,
    archived_at: overrides.archived_at || null,
    project_type: overrides.project_type || null,
    created_at: createdAt,
    updated_at: overrides.updated_at || createdAt,
    ...overrides,
  };
}

export function createProjectWithTasks(
  projectOverrides = {},
  taskOverrides = []
) {
  const project = createProject(projectOverrides);
  const overridesArray = Array.isArray(taskOverrides) ? taskOverrides : [];
  const tasks = overridesArray.map((taskOverride, index) =>
    createTask({
      project_id: project.id,
      name: taskOverride.name || `Task ${index + 1}`,
      ...taskOverride,
    })
  );

  return { project, tasks };
}

export function createUserWithProjects(
  userOverrides = {},
  projectCount = 2,
  tasksPerProject = 3
) {
  const user = createUser(userOverrides);
  const projects = [];

  for (let i = 0; i < projectCount; i += 1) {
    const taskOverrides = Array.from(
      { length: tasksPerProject },
      (_, index) => ({
        name: `Project ${i + 1} Task ${index + 1}`,
      })
    );
    const { project, tasks } = createProjectWithTasks(
      { user_id: user.id, name: `Project ${i + 1}` },
      taskOverrides
    );
    projects.push({ project, tasks });
  }

  return { user, projects };
}

export function buildProjectPayload(options = {}) {
  const { projectOverrides = {}, taskCount = 0, taskOverrides = [] } = options;
  const tasksToApply =
    taskOverrides.length > 0
      ? taskOverrides
      : Array.from({ length: taskCount }, () => ({}));

  const { project, tasks } = createProjectWithTasks(
    projectOverrides,
    tasksToApply
  );

  return {
    name: project.name,
    description: project.description,
    client: project.client,
    target_date: project.target_date,
    status: project.status,
    project_type: project.project_type,
    tasks: tasks.map((task) => ({
      name: task.name,
      category: task.category,
      status: task.status,
      notes: task.notes,
      required: task.required,
    })),
  };
}

export function seedProjectWithTasks(options = {}) {
  const {
    userOverrides = {},
    projectOverrides = {},
    tasks = [],
    taskCount = 0,
  } = options;

  resetFactoryState();
  const user = projectOverrides.user_id
    ? { id: projectOverrides.user_id }
    : seedUser({ ...createUser(userOverrides) });

  const project = seedProject({ user_id: user.id, ...projectOverrides });
  const seededTasks = [];

  tasks.forEach((task) => {
    seededTasks.push(seedTask({ project_id: project.id, ...task }));
  });

  if (taskCount > tasks.length) {
    for (let index = 0; index < taskCount - tasks.length; index += 1) {
      seededTasks.push(seedTask({ project_id: project.id }));
    }
  }

  return { user, project, tasks: seededTasks };
}

export function seedUserWithProjects(options = {}) {
  const {
    userOverrides = {},
    projectCount = 1,
    tasksPerProject = 0,
    taskOverrides = [],
  } = options;

  resetFactoryState();
  const user = seedUser({ ...createUser(userOverrides) });
  const projects = [];

  for (let i = 0; i < projectCount; i += 1) {
    const project = seedProject({ user_id: user.id });
    const tasks = [];

    const overridesForProject = taskOverrides[i] || [];
    overridesForProject.forEach((taskOverride) => {
      tasks.push(seedTask({ project_id: project.id, ...taskOverride }));
    });

    if (tasks.length < tasksPerProject) {
      const remaining = tasksPerProject - tasks.length;
      for (let index = 0; index < remaining; index += 1) {
        tasks.push(seedTask({ project_id: project.id }));
      }
    }

    projects.push({ ...project, tasks });
  }

  return { user, projects };
}

export function fetchProjectWithTasks(projectId) {
  const projectRows = executeQuery("SELECT * FROM projects WHERE id = ?", [
    projectId,
  ]);
  const taskRows = executeQuery("SELECT * FROM tasks WHERE project_id = ?", [
    projectId,
  ]);

  const project = projectRows[0] || null;
  if (!project) {
    return null;
  }

  return {
    ...project,
    tasks: taskRows,
  };
}
