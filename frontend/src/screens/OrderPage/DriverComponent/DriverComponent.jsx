import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCog } from "react-icons/fa";
import {
  listDrivers,
  setDriverDetailsData,
} from "../../../actions/driverActions";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { transformSelectOptions } from "../../../utils/transformers";

import FormWrapper from "../../../components/FormWrapper";
import SelectComponent from "../../../globalComponents/SelectComponent";

import "./DriverComponent.scss";

function DriverComponent() {
  const dispatch = useDispatch();
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const driverData = useSelector((state) => state.driversInfo.driver.data);

  const [selectedDriver, setSelectedDriver] = useState("");
  const driverOptions = transformSelectOptions(drivers, "full_name");

  useEffect(() => {
    const driver = drivers.find((driver) => driver.full_name === order.driver);
    setSelectedDriver(driver?.full_name);
    dispatch(setDriverDetailsData(driver));
    dispatch(listDrivers());
  }, [order]);

  const handleFormSubmit = () => {
    let dataToUpdate = {};
    dataToUpdate = { driver: selectedDriver };
    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
  };

  return (
    <>
      <FormWrapper
        title="Водій"
        content={
          <>
            <div className="order-details__content-row-block-value">
              <FaUserCog /> {driverData?.full_name || selectedDriver}
            </div>
            <div className="order-details__content-row-block-value">
              &#9990; {driverData?.phone_number}
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
            value={selectedDriver || ""}
            onChange={(e) => setSelectedDriver(e.target.value)}
            autoFocus
            options={driverOptions}
          />
        </form>
      </FormWrapper>
    </>
  );
}

export default DriverComponent;
