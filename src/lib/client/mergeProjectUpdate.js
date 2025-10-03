function normalizeDateOnly(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const maybeDate = new Date(trimmed);
    if (!Number.isNaN(maybeDate.getTime())) {
      return maybeDate.toISOString().split('T')[0];
    }
    return trimmed;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return value.toISOString().split('T')[0];
  }
  return '';
}

function normalizeDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return trimmed;
  }
  return null;
}

function normalizeTask(task = {}) {
  const normalized = { ...task };
  if ('required' in normalized) {
    normalized.required = Boolean(normalized.required);
  }
  if ('completed_at' in normalized) {
    normalized.completed_at = normalizeDateTime(normalized.completed_at);
  }
  if ('updated_at' in normalized) {
    normalized.updated_at = normalizeDateTime(normalized.updated_at);
  }
  return normalized;
}

function normalizeProject(project = {}) {
  const normalized = { ...project };
  if ('target_date' in normalized) {
    normalized.target_date = normalizeDateOnly(normalized.target_date);
  }
  return normalized;
}

function hasLegacyShape(update) {
  return update && typeof update === 'object' && 'id' in update && 'tasks' in update && !('project' in update);
}

export function mergeProjectUpdate(existingProject = { tasks: [] }, serverUpdate) {
  if (!serverUpdate) {
    return existingProject;
  }

  // Legacy shape: full project returned at top-level (pre-optimization)
  if (hasLegacyShape(serverUpdate)) {
    const normalizedProject = normalizeProject(serverUpdate);
    const normalizedTasks = Array.isArray(serverUpdate.tasks)
      ? serverUpdate.tasks.map(normalizeTask)
      : [];
    return {
      ...existingProject,
      ...normalizedProject,
      tasks: normalizedTasks,
    };
  }

  const updatePayload = { ...serverUpdate };
  const mergedProject = { ...existingProject };

  if ('changedTaskIds' in mergedProject) {
    delete mergedProject.changedTaskIds;
  }
  if ('deletedTaskIds' in mergedProject) {
    delete mergedProject.deletedTaskIds;
  }

  if (updatePayload.project) {
    Object.assign(mergedProject, normalizeProject(updatePayload.project));
  }

  const fullProjectUpdate = Boolean(updatePayload.fullProject) || Array.isArray(updatePayload.tasks);

  if (fullProjectUpdate) {
    const tasks = Array.isArray(updatePayload.tasks) ? updatePayload.tasks : [];
    mergedProject.tasks = tasks.map(normalizeTask);
    return mergedProject;
  }

  const updatedTasks = Array.isArray(updatePayload.updatedTasks)
    ? updatePayload.updatedTasks.map(normalizeTask)
    : [];
  const deletedTaskIds = new Set(updatePayload.deletedTaskIds || []);

  if (!Array.isArray(mergedProject.tasks)) {
    mergedProject.tasks = [];
  }

  if (deletedTaskIds.size > 0) {
    mergedProject.tasks = mergedProject.tasks.filter((task) => task && !deletedTaskIds.has(task.id));
  }

  if (updatedTasks.length === 0) {
    return mergedProject;
  }

  const updatedById = new Map();
  const updatedByName = new Map();
  updatedTasks.forEach((task) => {
    if (task.id) updatedById.set(task.id, task);
    if (task.name) updatedByName.set(task.name, task);
  });

  const seen = new Set();
  mergedProject.tasks = mergedProject.tasks.map((task) => {
    if (!task) return task;
    const updated = (task.id && updatedById.get(task.id)) || updatedByName.get(task.name);
    if (updated) {
      const identifier = updated.id || updated.name;
      if (identifier) {
        seen.add(identifier);
      }
      return { ...task, ...updated };
    }
    return task;
  });

  updatedTasks.forEach((task) => {
    const identifier = task.id || task.name;
    if (!identifier || seen.has(identifier)) {
      return;
    }
    mergedProject.tasks.push(task);
  });

  return mergedProject;
}
