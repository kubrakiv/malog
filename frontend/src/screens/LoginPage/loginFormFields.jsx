import { USER_CONSTANTS } from "../../constants/global";

const { EMAIL, PASSWORD } = USER_CONSTANTS;

export const formFields = [
  {
    id: EMAIL,
    placeholder: "Введіть логін",
    label: "Логін/Email",
    type: "text",
  },
  {
    id: PASSWORD,
    placeholder: "Введіть пароль",
    label: "Пароль",
    type: "password",
  },
];
