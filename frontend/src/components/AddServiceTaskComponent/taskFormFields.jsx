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
      title: "Тип завдання",
      type: "text",
      placeholder: "Виберіть тип завдання",
      component: "select",
    },
    {
      id: TASK_TITLE,
      title: "Назва завдання",
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
      title: "Дата початку",
      type: "date",
      placeholder: "Оберіть дату початку",
      component: "input",
    },
    {
      id: TASK_START_TIME,
      title: "Час початку",
      type: "time",
      placeholder: "Оберіть час початку",
      component: "input",
    },
  ],
  // Third Row: End Date and End Time
  [
    {
      id: TASK_END_DATE,
      title: "Дата завершення",
      type: "date",
      placeholder: "Оберіть дату завершення",
      component: "input",
      condition: (taskFields) =>
        ["loading", "unloading"].includes(taskFields[TASK_TYPE]?.toLowerCase()),
    },
    {
      id: TASK_END_TIME,
      title: "Час завершення",
      type: "time",
      placeholder: "Оберіть час завершення",
      component: "input",
      condition: (taskFields) =>
        ["loading", "unloading"].includes(taskFields[TASK_TYPE]?.toLowerCase()),
    },
  ],
  // Fourth Row: Truck and Driver
  [
    {
      id: TASK_TRUCK,
      title: "Автомобіль",
      type: "text",
      placeholder: "Виберіть тягач",
      component: "select",
    },
    {
      id: TASK_DRIVER,
      title: "Водій",
      type: "text",
      placeholder: "Виберіть водія",
      component: "select",
    },
  ],
];
