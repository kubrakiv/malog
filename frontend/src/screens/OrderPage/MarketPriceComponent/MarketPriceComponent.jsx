import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FormWrapper from "../../../components/FormWrapper";
import { updateOrder } from "../../../features/orders/ordersOperations";
import PricePerKmComponent from "../PricePerKmComponent/PricePerKmComponent";
import InputComponent from "../../../globalComponents/InputComponent";

function MarketPriceComponent() {
  const dispatch = useDispatch();
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);

  const [marketPrice, setMarketPrice] = useState("");

  useEffect(() => {
    setMarketPrice(order.market_price);
  }, [order]);

  const handleFormSubmit = () => {
    let dataToUpdate = {};
    dataToUpdate = { market_price: marketPrice };
    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
  };

  const allowedCustomers = [
    "ITC AGROMAT LTD",
    "LENEX S.R.O.",
    "NOVAS LLC",
    "Lenex s.r.o.",
  ];
  // Check if the order's customer is in the allowed customers list
  const isAllowedCustomer = allowedCustomers.includes(order.customer);

  return (
    isAllowedCustomer && (
      <>
        <FormWrapper
          title="Ринковий Тариф"
          content={
            <div className="order-details__content-row-block-value">
              {order.market_price} EUR
            </div>
          }
          handleFormSubmit={handleFormSubmit}
          secondTitle={
            <PricePerKmComponent
              type={"market-price"}
              price={order.market_price}
              distance={order.distance}
              currency={order.currency}
            />
          }
        >
          <form>
            <InputComponent
              title="Введіть ринковий тариф"
              name="price"
              type="number"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              autoFocus
              placeholder="Введіть ринковий тариф"
            />
          </form>
        </FormWrapper>
      </>
    )
  );
}

export default MarketPriceComponent;
