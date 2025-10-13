import { TASK_CONSTANTS } from "../../constants/global";

const {
  TASK_TITLE,
  TASK_TYPE,
  TASK_START_DATE,
  TASK_END_DATE,
  TASK_START_TIME,
  TASK_END_TIME,
  TASK_DRIVER,
  TASK_TRUCK,
} = TASK_CONSTANTS;

export const formFields = [
  // First Row: Task Type and Title
  [
    {
      id: TASK_TYPE,
      title: "Type",
      type: "text",
      placeholder: "Виберіть тип завдання",
      component: "select",
    },
    {
      id: TASK_TITLE,
      title: "Title",
      type: "text",
      placeholder: "Введіть назву завдання",
      component: "input",
      required: true,
    },
  ],
  // Second Row: Start Date, Start Time, End Date, End Time
  [
    {
      id: TASK_START_DATE,
      title: "Start Date",
      type: "date",
      placeholder: "Start Date",
      component: "input",
    },
    {
      id: TASK_START_TIME,
      title: "Start Time",
      type: "time",
      placeholder: "Start Time",
      component: "input",
    },
  ],
  // Third Row: End Date and End Time
  [
    {
      id: TASK_END_DATE,
      title: "End Date",
      type: "date",
      placeholder: "End Date",
      component: "input",
      condition: (taskFields) =>
        ["loading", "unloading"].includes(taskFields[TASK_TYPE]?.toLowerCase()),
    },
    {
      id: TASK_END_TIME,
      title: "End Time",
      type: "time",
      placeholder: "End Time",
      component: "input",
      condition: (taskFields) =>
        ["loading", "unloading"].includes(taskFields[TASK_TYPE]?.toLowerCase()),
    },
  ],
  // Fourth Row: Truck and Driver
  [
    {
      id: TASK_TRUCK,
      title: "Truck",
      type: "text",
      placeholder: "Виберіть тягач",
      component: "select",
    },
    {
      id: TASK_DRIVER,
      title: "Driver",
      type: "text",
      placeholder: "Виберіть водія",
      component: "select",
    },
  ],
];
