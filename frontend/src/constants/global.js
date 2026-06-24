export const DELIVERY_CONSTANTS = {
  START: "Start",
  UNLOADING: "Unloading",
  LOADING: "Loading",
  SERVICE: "Service",
  DRIVING: "Driving",
  WEEKEND: "Weekend",
  RESERVE: "Reserve",
  DELIVERY: "Delivery",
  WAITING: "Waiting",
  DELIVERED: "Delivered",
  CANCELED: "Cancelled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export const OFFICE_EMAILS = {
  OFFICE_EMAIL: "deltalogistics@email.cz",
  OFFICE_MANAGER_EMAIL: "kos@lenex.cz",
  OFFICE_DIRECTOR_EMAIL: "lebedev@lenex.cz",
};

export const ORDER_STATUSES = {
  CREATED: { id: 1, name: "created" },
  PLANNED: { id: 2, name: "planned" },
  ACCEPTED: { id: 3, name: "accepted" },
  LOADING_IN_PROGRESS: { id: 4, name: "loading_in_progress" },
  IN_TRANSIT: { id: 5, name: "in_transit" },
  UNLOADING_IN_PROGRESS: { id: 6, name: "unloading_in_progress" },
  COMPLETED: { id: 7, name: "completed" },
  DOCUMENTS_SENT: { id: 8, name: "documents_sent" },
  PAID: { id: 9, name: "paid" },
};

export const TRUCK_SOVTES_CONSTANTS = {
  "3SR2381": { id: 71224 },
  "3SR1953": { id: 71221 },
  "5E93576": { id: 152847 },
  "5E93578": { id: 152838 },
  "6E20185": { id: 171023 },
  "6E20189": { id: 166824 },
  "6SF4164": { id: 188764 },
  "6SF4310": { id: 189660 },
  "6SH2995": { id: 179926 },
  "7AA9368": { id: 167715 },
};

export const TRAILER_SOVTES_CONSTANTS = {
  "4SA5875": { id: 68029 },
  "4SD8097": { id: 68032 },
  "9AE8872": { id: 162652 },
  "9AF0659": { id: 174656 },
  "9AF1015": { id: 175989 },
  "9AF1016": { id: 183187 },
  "9AE8875": { id: 161774 },
  "9AE9464": { id: 165885 },
  "9AE6551": { id: 148484 },
  "9AE6552": { id: 148478 },
};

export const DRIVER_SOVTES_CONSTANTS = {
  "Mykhailo Shopa": { id: 178624 },
  "Sergii Bereziuk": { id: 134582 },
  "Oleg Kuzbyt": { id: 193688 },
  "Volodymyr Mozhaiko": { id: 151197 },
  "Petro Sobko": { id: 70014 },
  "Yurii Sladkovskyi": { id: 212269 },
  "Mykola Holovko": { id: 212271 },
  "Andrii Doronkin": { id: 69993 },
  "Oleksandr Zinchenko": { id: 69999 },
  "Oleh Kopchuk": { id: 70003 },
  "Piotr Diug": { id: 95905 },
};

export const CUSTOMER_MANAGER_CONSTANTS = {
  FULL_NAME: "full_name",
  POSITION: "position",
  PHONE: "phone",
  EMAIL: "email",
  CUSTOMER: "customer",
};

export const CUSTOMER_CONSTANTS = {
  COMPANY_NAME: "name",
  NIP_NUMBER: "nip_number",
  VAT_NUMBER: "vat_number",
  EMAIL: "email",
  WEBSITE: "website",
  POST_ADDRESS: "post_address",
  LEGAL_ADDRESS: "legal_address",
};

export const TRUCK_CONSTANTS = {
  TRUCK_BRAND: "brand",
  TRUCK_MODEL: "model",
  TRUCK_PLATES: "plates",
  TRUCK_ENTRY_DATE: "entry_date",
  TRUCK_END_DATE: "end_date",
  TRUCK_VIN_CODE: "vin_code",
  TRUCK_YEAR: "year",
  TRUCK_ENTRY_MILEAGE: "entry_mileage",
  TRUCK_PRICE: "price",
  TRUCK_GPS_ID: "gps_id",
  TRUCK_DIESEL_NORM: "diesel_norm",
  TRUCK_ADBLUE_NORM: "adblue_norm",
  TRUCK_TIRE_COST_PER_KM: "tire_cost_per_km",
};

export const TRAILER_CONSTANTS = {
  TRAILER_BRAND: "brand",
  TRAILER_PLATES: "plates",
  TRAILER_ENTRY_DATE: "entry_date",
  TRAILER_END_DATE: "end_date",
  TRAILER_VIN_CODE: "vin_code",
  TRAILER_YEAR: "year",
  TRAILER_ENTRY_MILEAGE: "entry_mileage",
  TRAILER_PRICE: "price",
};

export const TASK_CONSTANTS = {
  TASK_TITLE: "title",
  TASK_TYPE: "type",
  TASK_DRIVER: "driver",
  TASK_TRUCK: "truck",
  TASK_START_DATE: "start_date",
  TASK_START_TIME: "start_time",
  TASK_END_DATE: "end_date",
  TASK_END_TIME: "end_time",
};

export const PRICE_CONSTANTS = {
  PRICE: "price",
  PAYMENT_PERIOD: "payment_period",
  PAYMENT_TYPE: "payment_type",
  CURRENCY: "currency",
  VAT: "vat",
};

export const USER_CONSTANTS = {
  EMAIL: "email",
  PASSWORD: "password",
};

export const POINT_CONSTANTS = {
  COMPANY_NAME: "company_name",
  COUNTRY: "country",
  CUSTOMER: "customer",
  POSTAL_CODE: "postal_code",
  CITY: "city",
  STREET: "street",
  STREET_NUMBER: "street_number",
  GPS_LATITUDE: "gps_latitude",
  GPS_LONGITUDE: "gps_longitude",
};
