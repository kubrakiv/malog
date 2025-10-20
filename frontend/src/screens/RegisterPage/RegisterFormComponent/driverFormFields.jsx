import { REGISTER_CONSTANTS } from "./constants";

const {
  ROLE,
  FIRST_NAME,
  LAST_NAME,
  EMAIL,
  PHONE,
  PASSWORD,
  CONFIRM_PASSWORD,
} = REGISTER_CONSTANTS;

export const formFields = {
  basic: [
    // Left Column
    [
      {
        id: FIRST_NAME,
        title: "Ім'я",
        type: "text",
        placeholder: "Введіть ім'я",
        icon: "👤",
      },
      {
        id: EMAIL,
        title: "Email",
        type: "email",
        placeholder: "Введіть email",
        icon: "✉️",
      },
      {
        id: PASSWORD,
        title: "Пароль",
        type: "password",
        placeholder: "Введіть пароль",
        icon: "🔒",
      },
    ],
    // Right Column
    [
      {
        id: LAST_NAME,
        title: "Прізвище",
        type: "text",
        placeholder: "Введіть прізвище",
        icon: "👤",
      },
      {
        id: PHONE,
        title: "Телефон",
        type: "tel",
        placeholder: "Введіть телефон",
        icon: "📱",
      },
      {
        id: CONFIRM_PASSWORD,
        title: "Повторний пароль",
        type: "password",
        placeholder: "Повторіть пароль",
        icon: "🔒",
      },
    ],
  ],
};
