import { v4 as uuidv4 } from "uuid";
import { transformDate } from "../../../utils/formatDate";

const getTrailerDetails = (trailer) => [
  {
    id: uuidv4(),
    title: "Марка",
    value: trailer?.brand || "None",
  },
  {
    id: uuidv4(),
    title: "Державний номер",
    value: trailer?.plates,
  },
  {
    id: uuidv4(),
    title: "Рік випуску",
    value: trailer?.year,
  },
  {
    id: uuidv4(),
    title: "VIN номер",
    value: trailer?.vin_code,
  },
  {
    id: uuidv4(),
    title: "Дата введення в експлуатацію",
    value: trailer?.entry_date
      ? transformDate(trailer?.entry_date)
      : "Не вказано",
  },
  {
    id: uuidv4(),
    title: "Дата вибуття з експлуатації",
    value: trailer?.end_date ? transformDate(trailer?.end_date) : "Не вказано",
  },
  {
    id: uuidv4(),
    title: "Пробіг при введенні",
    value: trailer?.entry_mileage,
  },
  {
    id: uuidv4(),
    title: "Ціна",
    value: trailer?.price,
  },
];

export default getTrailerDetails;
