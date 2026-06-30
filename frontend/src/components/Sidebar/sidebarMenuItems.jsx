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
import { IoSettingsSharp } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";

const menuItems = [
  {
    title: "Система",
    path: "/help",
    icon: <IoSettingsSharp />,
    childrens: [
      {
        path: "/onboarding",
        title: "Налаштування",
      },
      {
        path: "/main",
        title: "Функціонал",
      },
    ],
  },
  {
    title: "Моя компанія",
    path: "",
    icon: <FaTruckMoving />,
    childrens: [
      {
        path: "/company",
        title: "Про компанію",
      },
      {
        path: "/userlist",
        title: "Співробітники",
      },
      {
        path: "/fleet",
        title: "Автопарк",
      },
      {
        path: "/settings/cost-centers",
        title: "Центри витрат",
      },
      {
        path: "/settings/route-categories",
        title: "Категорії маршрутів",
      },
    ],
  },
  {
    path: "/calculator",
    title: "Калькулятор",
    icon: <FaCalculator />,
    childrens: [
      {
        path: "/calculator",
        title: "Розрахунок вартості",
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
    title: "Замовлення",
    path: "/orders",
    icon: <FaThList />,
    childrens: [
      {
        path: "/orders/add",
        title: "Створити замовлення",
      },
      {
        path: "/orders",
        title: "Поточні замовлення",
      },
      {
        path: "/free-orders",
        title: "Вільні замовлення",
      },
    ],
  },
  {
    title: "Рахунки",
    path: "/invoices",
    icon: <FaFileInvoice />,
  },
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
