import { createSlice } from "@reduxjs/toolkit";
import { getISOWeek, parseISO, getYear } from "date-fns";

function getWeekKey(startDate) {
  const parsed =
    typeof startDate === "string" ? parseISO(startDate) : startDate;
  const week = getISOWeek(parsed);
  const year = getYear(parsed);
  return `${year}-${week}`;
}

import {
  createTask,
  deleteTask,
  listTasks,
  listTasksByWeek,
  updateTask,
} from "./tasksOperations";

export const taskSlice = createSlice({
  name: "task",
  initialState: {
    tasks: {
      data: [],
      byWeek: {},
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listTasks.fulfilled, (state, action) => {
        state.tasks.data = action.payload;
      })
      .addCase(listTasksByWeek.fulfilled, (state, action) => {
        const { year, week } = action.meta.arg;
        const key = `${year}-${week}`;
        state.tasks.byWeek[key] = action.payload;
      })
      // .addCase(updateTask.fulfilled, (state, action) => {
      //   const index = state.tasks.data.findIndex(
      //     (task) => task.id === action.payload.id
      //   );
      //   state.tasks.data[index] = action.payload;
      // })
      // .addCase(createTask.fulfilled, (state, action) => {
      //   state.tasks.data.push(action.payload);
      // })
      // .addCase(deleteTask.fulfilled, (state, action) => {
      //   state.tasks.data = state.tasks.data.filter(
      //     (task) => task.id !== action.payload
      //   );
      // })
      .addCase(updateTask.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        const weekKey = getWeekKey(updatedTask.start_date); // function below

        const tasks = state.tasks.byWeek[weekKey];
        if (tasks) {
          const index = tasks.findIndex((task) => task.id === updatedTask.id);
          if (index !== -1) {
            tasks[index] = updatedTask;
          }
        }
      })
      .addCase(createTask.fulfilled, (state, action) => {
        const newTask = action.payload;
        const weekKey = getWeekKey(newTask.start_date);

        if (!state.tasks.byWeek[weekKey]) {
          state.tasks.byWeek[weekKey] = [];
        }

        state.tasks.byWeek[weekKey].push(newTask);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const deletedTaskId = action.payload;

        for (const [weekKey, tasks] of Object.entries(state.tasks.byWeek)) {
          const index = tasks.findIndex((task) => task.id === deletedTaskId);
          if (index !== -1) {
            state.tasks.byWeek[weekKey].splice(index, 1);
            break;
          }
        }
      });
  },
});

export const taskActions = taskSlice.actions;
export default taskSlice.reducer;
