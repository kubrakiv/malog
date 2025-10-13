import { CUSTOMER_MANAGER_CONSTANTS } from "../../../constants/global";

const { FULL_NAME, POSITION, PHONE, EMAIL, CUSTOMER } =
  CUSTOMER_MANAGER_CONSTANTS;

export const formFields = [
  [
    {
      id: FULL_NAME,
      title: "ПІБ",
      type: "text",
      placeholder: "ПІБ",
    },
    {
      id: POSITION,
      title: "Посада",
      type: "text",
      placeholder: "Посада",
    },
    {
      id: PHONE,
      title: "Телефон",
      type: "text",
      placeholder: "Телефон",
    },
    {
      id: EMAIL,
      title: "Email",
      type: "email",
      placeholder: "Email",
    },
  ],
];
