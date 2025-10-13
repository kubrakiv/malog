import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { FaTruckMoving, FaUserCog } from "react-icons/fa";

import { listTrucks } from "../../../features/trucks/trucksOperations";
import { listDrivers } from "../../../actions/driverActions";
import { listOrderDetails } from "../../../features/orders/ordersOperations";
import { transformSelectOptions } from "../../../utils/transformers";

import SelectComponent from "../../../globalComponents/SelectComponent";
import FormWrapper from "../../../components/FormWrapper";
import { updateTask } from "../../../features/tasks/tasksOperations";
import { updateOrder } from "../../../features/orders/ordersOperations";

const AssignTruckAndDriverCompoonent = () => {
  const dispatch = useDispatch();
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const trucks = useSelector((state) => state.trucksInfo.trucks.data);
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");

  const driverOptions = transformSelectOptions(drivers, "full_name");
  const truckOptions = transformSelectOptions(trucks, "plates");

  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listDrivers());
  }, []);

  const handleFormSubmit = async () => {
    console.log("Form submitted");
    console.log("ORDER ID", order.id);
    let dataToUpdate = {};
    dataToUpdate = { driver: selectedDriver, truck: selectedTruck };
    await dispatch(updateOrder({ dataToUpdate, orderId: order.id })).unwrap();
    console.log("Order updated");
    for (let task of order.tasks) {
      const updatedTask = { ...task, ...dataToUpdate, order: order.number };
      await dispatch(updateTask(updatedTask)).unwrap();
    }
    dispatch(listOrderDetails(order.id));
    console.log("Tasks updated");
  };

  return (
    <>
      <FormWrapper
        title="Призначити автомобіль та водія"
        content={
          <>
            <div className="order-details__content-row-block-value">
              <FaTruckMoving /> {"selectedTruck"}
            </div>
            <div className="order-details__content-row-block-value">
              <FaUserCog /> {"selectedDriver"}
            </div>
          </>
        }
        handleFormSubmit={handleFormSubmit}
      >
        <form>
          <SelectComponent
            title="Select Truck"
            id="truck"
            name="truck"
            value={selectedTruck || ""}
            onChange={(e) => setSelectedTruck(e.target.value)}
            options={truckOptions}
          />
          <SelectComponent
            title="Select Driver"
            id="driver"
            name="driver"
            value={selectedDriver || ""}
            onChange={(e) => setSelectedDriver(e.target.value)}
            options={driverOptions}
          />
        </form>
      </FormWrapper>
    </>
  );
};

export default AssignTruckAndDriverCompoonent;
