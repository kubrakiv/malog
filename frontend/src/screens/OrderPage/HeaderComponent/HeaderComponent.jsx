import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import { getRouteTitle } from "../../../utils/getRouteTitle";

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
        {tasks?.length > 0 && (
          <div
            className="order-details__header-block order-details__header-block--route"
            title={getRouteTitle(tasks)}
          >
            {getRouteTitle(tasks)}
          </div>
        )}
        <div className="order-details__header-block order-details__header-block--number">
          {order.number}
        </div>
      </div>
    </>
  );
};

export default HeaderComponent;
