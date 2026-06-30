import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { FaTruckMoving, FaUserCog, FaTrailer } from "react-icons/fa";

import { listTrucks } from "../../../features/trucks/trucksOperations";
import { listDrivers } from "../../../features/drivers/driversOperations";
import { listOrderDetails } from "../../../features/orders/ordersOperations";
import { transformSelectOptions } from "../../../utils/transformers";

import SelectComponent from "../../../globalComponents/SelectComponent";
import FormWrapper from "../../../components/FormWrapper";
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

  // A truck's trailer is tracked on the Truck itself (Truck.trailer), not on
  // the Order — so picking a truck here already carries its currently linked
  // trailer along; this just surfaces that for visibility.
  const linkedTrailerPlates = trucks.find((t) => t.plates === selectedTruck)
    ?.trailer_details?.plates;

  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listDrivers());
  }, []);

  // Pre-fill the selects with the truck/driver already assigned to this order
  // (e.g. carried over from a Sovtes tender) once the order details load.
  useEffect(() => {
    setSelectedTruck(order?.truck || "");
    setSelectedDriver(order?.driver || "");
  }, [order?.truck, order?.driver]);

  const handleFormSubmit = async () => {
    const dataToUpdate = { driver: selectedDriver, truck: selectedTruck };
    try {
      // Saving the order alone is enough — the backend propagates truck/driver
      // down to all of the order's tasks (OrderSerializer.update()).
      await dispatch(updateOrder({ dataToUpdate, orderId: order.id })).unwrap();
      await dispatch(listOrderDetails(order.id));
      toast.success("Автомобіль та водія призначено");
    } catch (err) {
      toast.error(err?.error || "Не вдалося призначити автомобіль та водія");
      throw err;
    }
  };

  return (
    <>
      <FormWrapper
        title="Призначити автомобіль та водія"
        content={
          <>
            <div className="order-details__content-row-block-value">
              <FaTruckMoving /> {selectedTruck}
            </div>
            {linkedTrailerPlates && (
              <div className="order-details__content-row-block-value">
                <FaTrailer /> {linkedTrailerPlates}
              </div>
            )}
            <div className="order-details__content-row-block-value">
              <FaUserCog /> {selectedDriver}
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
          {linkedTrailerPlates && (
            <div className="order-details__content-row-block-value">
              <FaTrailer /> Причеп: {linkedTrailerPlates}
            </div>
          )}
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
