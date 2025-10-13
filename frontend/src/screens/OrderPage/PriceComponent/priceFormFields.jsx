import { PRICE_CONSTANTS } from "../../../constants/global";

const { PRICE, PAYMENT_PERIOD, PAYMENT_TYPE, CURRENCY, VAT } = PRICE_CONSTANTS;

export const formFields = [
  {
    id: PRICE,
    placeholder: "Тариф",
    type: "number",
    component: "input",
  },
  {
    id: PAYMENT_PERIOD,
    placeholder: "Дні оплати",
    type: "text",
    component: "input",
  },
  {
    id: PAYMENT_TYPE,
    type: "text",
    component: "select",
    title: "Тип оплати",

    // isFullWidth: true,
  },
  {
    id: CURRENCY,
    placeholder: "Валюта",
    type: "text",
    component: "select",
    title: "Валюта",
  },
  {
    id: VAT,
    type: "checkbox",
    label: "ПДВ",
    component: "checkbox",
  },
];
