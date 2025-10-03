export function prepareProjectPayload(project) {
  if (!project || typeof project !== 'object') {
    return project;
  }

  const payload = { ...project };

  if ('__taskUpdate' in payload) {
    delete payload.__taskUpdate;
  }

  if (Array.isArray(payload.tasks)) {
    if (Array.isArray(payload.changedTaskIds) && payload.changedTaskIds.length > 0) {
      const changedIdSet = new Set(payload.changedTaskIds.filter(Boolean));
      payload.tasks = payload.tasks
        .filter((task) => {
          if (!task) return false;
          if (!task.id) return true;
          return changedIdSet.has(task.id);
        })
        .map((task) => ({ ...task }));
    } else {
      payload.tasks = payload.tasks.map((task) => (task ? { ...task } : task));
    }
  }

  return payload;
}
