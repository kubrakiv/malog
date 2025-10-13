import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import { getRouteTitle } from "../../../utils/getRouteTitle";

import OrderNumberComponent from "../OrderNumberComponent/OrderNumberComponent";

import "./HeaderComponent.scss";

const HeaderComponent = () => {
  const navigate = useNavigate();

  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const orderTasks = useSelector(
    (state) => state.ordersInfo.orderDetails.data.tasks
  );

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    setTasks(order.tasks);
  }, [order]);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="order-details__header">
        <div className="order-details__return-button" onClick={handleGoBack}>
          <FaArrowLeft />
        </div>
        <div className="order-details__header-block">
          Маршрут № {order.number}
        </div>
        {tasks?.length > 0 && (
          <div className="order-details__header-block">
            {getRouteTitle(tasks)}
          </div>
        )}

        <OrderNumberComponent />
      </div>
    </>
  );
};

export default HeaderComponent;
