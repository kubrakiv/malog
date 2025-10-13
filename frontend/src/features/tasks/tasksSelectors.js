export const selectTasks = (state) => state.tasksInfo.tasks.data;

export const selectTasksByWeek = (state) => state.tasksInfo.tasks?.byWeek || {};
