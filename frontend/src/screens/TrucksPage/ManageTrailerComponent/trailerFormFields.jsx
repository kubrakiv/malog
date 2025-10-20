import { TRAILER_CONSTANTS } from "../../../constants/global";

const {
  TRAILER_BRAND,
  TRAILER_PLATES,
  TRAILER_ENTRY_DATE,
  TRAILER_END_DATE,
  TRAILER_VIN_CODE,
  TRAILER_YEAR,
  TRAILER_ENTRY_MILEAGE,
  TRAILER_PRICE,
} = TRAILER_CONSTANTS;

export const formFields = [
  [
    {
      id: TRAILER_BRAND,
      title: "Марка причепа",
      type: "text",
      placeholder: "Марка",
      icon: "🚛",
    },
    {
      id: TRAILER_PLATES,
      title: "Державний номер",
      type: "text",
      placeholder: "Державний номер",
      icon: "🔢",
    },
    {
      id: TRAILER_VIN_CODE,
      title: "VIN номер",
      type: "text",
      placeholder: "VIN номер",
      icon: "🔑",
    },
    {
      id: TRAILER_YEAR,
      title: "Рік випуску",
      type: "number",
      placeholder: "Рік випуску",
      icon: "📅",
    },
  ],
  [
    {
      id: TRAILER_ENTRY_DATE,
      title: "Дата введення",
      type: "date",
      placeholder: "Дата введення",
      icon: "➕",
    },
    {
      id: TRAILER_END_DATE,
      title: "Дата вибуття",
      type: "date",
      placeholder: "Дата вибуття",
      icon: "➖",
    },
    {
      id: TRAILER_ENTRY_MILEAGE,
      title: "Пробіг при введенні",
      type: "number",
      placeholder: "Пробіг при введенні",
      icon: "🔄",
    },
    {
      id: TRAILER_PRICE,
      title: "Ціна",
      type: "number",
      placeholder: "Ціна",
      icon: "💰",
    },
  ],
];
