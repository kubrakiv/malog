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
    [
      {
        id: TRUCK_BRAND,
        title: "Марка автомобіля",
        type: "text",
        placeholder: "Марка",
      },
      {
        id: TRUCK_MODEL,
        title: "Модель автомобіля",
        type: "text",
        placeholder: "Модель",
      },
      {
        id: TRUCK_PLATES,
        title: "Державний номер",
        type: "text",
        placeholder: "Державний номер",
      },
      {
        id: TRUCK_VIN_CODE,
        title: "VIN номер",
        type: "text",
        placeholder: "VIN номер",
      },
      {
        id: TRUCK_YEAR,
        title: "Рік випуску",
        type: "number",
        placeholder: "Рік випуску",
      },
    ],
    [
      {
        id: TRUCK_ENTRY_DATE,
        title: "Дата введення",
        type: "date",
        placeholder: "Дата введення",
      },
      {
        id: TRUCK_END_DATE,
        title: "Дата вибуття",
        type: "date",
        placeholder: "Дата вибуття",
      },
      {
        id: TRUCK_ENTRY_MILEAGE,
        title: "Пробіг при введенні",
        type: "number",
        placeholder: "Пробіг при введенні",
      },
      { id: TRUCK_PRICE, title: "Ціна", type: "number", placeholder: "Ціна" },
      {
        id: TRUCK_GPS_ID,
        title: "GPS ID",
        type: "text",
        placeholder: "GPS ID",
      },
    ],
  ],
  norms: [
    [
      {
        id: TRUCK_DIESEL_NORM,
        title: "Норма витрати пального, л/100 км",
        type: "number",
        placeholder: "л/100 км",
      },
      {
        id: TRUCK_ADBLUE_NORM,
        title: "Норма витрати AdBlue, л/100 км",
        type: "number",
        placeholder: "л/100 км",
      },
      {
        id: TRUCK_TIRE_COST_PER_KM,
        title: "Вартість шин, євро/км",
        type: "number",
        placeholder: "євро/км",
      },
    ],
  ],
};
