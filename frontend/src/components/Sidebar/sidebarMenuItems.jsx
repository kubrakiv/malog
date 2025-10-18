import React from "react";
import {
  FaCalendarWeek,
  FaTruckMoving,
  FaTasks,
  FaThList,
  FaPlus,
  FaMapMarkerAlt,
  FaUsers,
  FaFileInvoice,
  FaGlobe,
  FaCalculator,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

const menuItems = [
  {
    title: "Моя компанія",
    path: "/main",
    icon: <FaTruckMoving />,
    childrens: [
      {
        path: "/main",
        title: "Головна сторінка",
      },
      {
        path: "/userlist",
        title: "Мої співробітники",
      },
      {
        path: "/drivers",
        title: "Мої водії",
      },
      {
        path: "/vehicles",
        title: "Мої автомобілі",
      },
    ],
  },

  // {
  //   path: "/dashboard",
  //   title: "Dashboard",
  //   icon: <MdDashboard />,
  // },
  {
    path: "/calculator",
    title: "Калькулятор",
    icon: <FaCalculator />,
    childrens: [
      {
        path: "/calculator",
        title: "Калькулятор",
      },
    ],
  },
  {
    title: "Рознарядка",
    path: "/planner",
    icon: <FaCalendarWeek />,
    childrens: [
      {
        path: "/planner",
        title: "Тижневе планування",
      },
    ],
  },
  {
    title: "Маршрути",
    path: "/orders",
    icon: <FaThList />,
    childrens: [
      {
        path: "/orders",
        title: "Поточні замовлення",
      },
      {
        path: "/free-orders",
        title: "Вільні замовлення",
      },
      {
        path: "/orders/add",
        title: "Створити замовлення",
      },
    ],
  },
  {
    title: "Рахунки",
    path: "/invoices",
    icon: <FaFileInvoice />,
  },
  // {
  //   title: "Завдання",
  //   path: "/tasks",
  //   icon: <FaTasks />,
  //   childrens: [
  //     {
  //       path: "/tasks",
  //       title: "Реєстр завдань",
  //     },
  //     {
  //       path: "/tasks/add",
  //       title: "Додати завдання",
  //     },
  //   ],
  // },
  // {
  //   path: "/map",
  //   title: "Карта",
  //   icon: <FaMapMarkedAlt />,
  // },
  {
    path: "/points",
    title: "Мої пункти",
    icon: <FaMapMarkerAlt />,
  },
  {
    path: "/customers",
    title: "Замовники",
    icon: <FaUsers />,
  },
  {
    path: "/platforms",
    title: "Платформи",
    icon: <FaGlobe />,
    childrens: [
      {
        path: "/platforms/sovtes",
        title: "СОВТЕС",
      },
      {
        path: "/platforms/lardi",
        title: "ЛАРДІ",
      },
    ],
  },
];

export default menuItems;
