import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updateOrder } from "../../../features/orders/ordersOperations";
import { listCustomers } from "../../../features/customers/customersOperations";
import {
  setCustomerDetailsData,
  setManagersListData,
} from "../../../features/customers/customersSlice";
import { transformSelectOptions } from "../../../utils/transformers";

import PlatformComponent from "../../../components/PlatformComponent/PlatformComponent";
import FormWrapper from "../../../components/FormWrapper";
import SelectComponent from "../../../globalComponents/SelectComponent";

import "./CustomerComponent.scss";

function CustomerComponent() {
  const dispatch = useDispatch();

  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const customers = useSelector((state) => state.customersInfo.customers.data);

  const [selectedCustomer, setSelectedCustomer] = useState(order.customer);
  const customerOptions = transformSelectOptions(customers, "name");

  useEffect(() => {
    dispatch(listCustomers());
  }, []);

  useEffect(() => {
    const currentCustomer = customers.find(
      (customer) => customer.name === order.customer
    );
    if (currentCustomer) {
      dispatch(setManagersListData(currentCustomer.managers));
    }
  }, [dispatch, order.customer, customers]);

  useEffect(() => {
    const customer = customers.find(
      (customer) => customer.name === selectedCustomer
    );
    dispatch(setCustomerDetailsData(customer));
  }, [dispatch, selectedCustomer, customers]);

  const handleFormSubmit = () => {
    let dataToUpdate = {};
    dataToUpdate.customer = selectedCustomer;
    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
  };

  return (
    <>
      <FormWrapper
        title="Замовник"
        content={
          <div className="order-details__content-row-block-value">
            {order.customer}
          </div>
        }
        secondTitle={<PlatformComponent platform={order.platform} />}
        handleFormSubmit={handleFormSubmit}
      >
        <form>
          <SelectComponent
            title="Виберіть замовника"
            id="customer"
            name="customer"
            value={selectedCustomer || ""}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            autoFocus
            options={customerOptions}
          />
        </form>
      </FormWrapper>
    </>
  );
}

export default CustomerComponent;
