import React from "react";
import {
  FaIdCard,
  FaPhone,
  FaEnvelope,
  FaBirthdayCake,
  FaAddressCard,
  FaCar,
} from "react-icons/fa";
import { transformDate } from "../../../utils/formatDate";

export const driverDetails = [
  {
    label: "Особові дані",
    items: [
      { key: "first_name", label: "Ім'я", icon: FaIdCard },
      { key: "last_name", label: "Прізвище", icon: FaIdCard },
      { key: "patronymic", label: "По-батькові", icon: FaIdCard },
      { key: "phone_number", label: "Телефон", icon: FaPhone },
      { key: "email", label: "Email", icon: FaEnvelope },
      {
        key: "birth_date",
        label: "Дата народження",
        icon: FaBirthdayCake,
        formatFn: transformDate,
      },
      { key: "address", label: "Адреса", icon: FaAddressCard },
    ],
  },
  {
    label: "Водійська інформація",
    items: [
      { key: "license_number", label: "Номер ліцензії", icon: FaCar },
      {
        key: "license_expire_date",
        label: "Дата закінчення ліцензії",
        icon: FaCar,
        formatFn: transformDate,
      },
    ],
  },
];
