import React from "react";
import { useSelector } from "react-redux";

const PlatformComponent = () => {
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);

  return (
    <>
      {order.platform && (
        <div className="order-details__platform">
          <span className="order-details__platform_text">{order.platform}</span>
        </div>
      )}
    </>
  );
};

export default PlatformComponent;
