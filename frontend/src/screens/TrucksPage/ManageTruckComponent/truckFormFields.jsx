import { TRUCK_CONSTANTS } from "../../../constants/global";

const {
  TRUCK_BRAND,
  TRUCK_MODEL,
  TRUCK_PLATES,
  TRUCK_ENTRY_DATE,
  TRUCK_END_DATE,
  TRUCK_VIN_CODE,
  TRUCK_YEAR,
  TRUCK_ENTRY_MILEAGE,
  TRUCK_PRICE,
  TRUCK_GPS_ID,
  TRUCK_DIESEL_NORM,
  TRUCK_ADBLUE_NORM,
  TRUCK_TIRE_COST_PER_KM,
} = TRUCK_CONSTANTS;

export const formFields = {
  basic: [
    // Left Column
    [
      {
        id: TRUCK_BRAND,
        title: "Марка автомобіля",
        type: "text",
        placeholder: "Введіть марку",
        icon: "🚚",
      },
      {
        id: TRUCK_MODEL,
        title: "Модель автомобіля",
        type: "text",
        placeholder: "Введіть модель",
        icon: "📋",
      },
      {
        id: TRUCK_PLATES,
        title: "Державний номер",
        type: "text",
        placeholder: "Наприклад: AA 1234 BB",
        icon: "🔢",
      },
      {
        id: TRUCK_VIN_CODE,
        title: "VIN номер",
        type: "text",
        placeholder: "17-значний код",
        icon: "🔑",
      },
      {
        id: TRUCK_GPS_ID,
        title: "GPS ID",
        type: "text",
        placeholder: "Ідентифікатор GPS",
        icon: "📍",
      },
    ],
    // Right Column
    [
      {
        id: TRUCK_YEAR,
        title: "Рік випуску",
        type: "number",
        placeholder: "Наприклад: 2022",
        icon: "📅",
      },
      {
        id: TRUCK_ENTRY_DATE,
        title: "Дата введення",
        type: "date",
        placeholder: "Дата введення",
        icon: "➕",
      },
      {
        id: TRUCK_END_DATE,
        title: "Дата вибуття",
        type: "date",
        placeholder: "Дата вибуття",
        icon: "➖",
      },
      {
        id: TRUCK_ENTRY_MILEAGE,
        title: "Пробіг при введенні",
        type: "number",
        placeholder: "Початковий пробіг (км)",
        icon: "🔄",
      },
      {
        id: TRUCK_PRICE,
        title: "Ціна",
        type: "number",
        placeholder: "Вартість в UAH",
        icon: "💰",
      },
    ],
  ],
  norms: [
    // Left Column
    [
      {
        id: TRUCK_DIESEL_NORM,
        title: "Норма витрати пального, л/100 км",
        type: "number",
        placeholder: "Витрата пального",
        icon: "⛽",
      },
      {
        id: TRUCK_ADBLUE_NORM,
        title: "Норма витрати AdBlue, л/100 км",
        type: "number",
        placeholder: "Витрата AdBlue",
        icon: "💧",
      },
    ],
    // Right Column
    [
      {
        id: TRUCK_TIRE_COST_PER_KM,
        title: "Вартість шин, євро/км",
        type: "number",
        placeholder: "Вартість на км",
        icon: "🛞",
      },
    ],
  ],
};
