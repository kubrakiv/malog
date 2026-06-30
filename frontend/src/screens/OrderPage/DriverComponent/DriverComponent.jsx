import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCog } from "react-icons/fa";
import { listDrivers } from "../../../features/drivers/driversOperations";
import { setSelectedDriver } from "../../../features/drivers/driversSlice";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { transformSelectOptions } from "../../../utils/transformers";

import FormWrapper from "../../../components/FormWrapper";
import SelectComponent from "../../../globalComponents/SelectComponent";

import "./DriverComponent.scss";

function DriverComponent() {
  const dispatch = useDispatch();
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const driverData = useSelector((state) => state.driversInfo.selectedDriver.data);

  const [selectedDriverName, setSelectedDriverName] = useState("");
  const driverOptions = transformSelectOptions(drivers, "full_name");

  useEffect(() => {
    const driver = drivers.find((driver) => driver.full_name === order.driver);
    setSelectedDriverName(driver?.full_name ?? "");
    dispatch(setSelectedDriver(driver));
    dispatch(listDrivers());
  }, [order]);

  const handleFormSubmit = () => {
    dispatch(updateOrder({ dataToUpdate: { driver: selectedDriverName }, orderId: order.id }));
  };

  return (
    <>
      <FormWrapper
        title="Водій"
        content={
          <>
            <div className="order-details__content-row-block-value">
              <FaUserCog /> {order.driver_info?.full_name || driverData?.full_name || selectedDriverName}
            </div>
            <div className="order-details__content-row-block-value">
              &#9990; {order.driver_info?.phone_number || driverData?.phone_number}
            </div>
          </>
        }
        handleFormSubmit={handleFormSubmit}
      >
        <form>
          <SelectComponent
            title="Виберіть водія"
            id="driver"
            name="driver"
            value={selectedDriverName}
            onChange={(e) => setSelectedDriverName(e.target.value)}
            autoFocus
            options={driverOptions}
          />
        </form>
      </FormWrapper>
    </>
  );
}

export default DriverComponent;
