import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTruckMoving } from "react-icons/fa";
import { listTrucks } from "../../../features/trucks/trucksOperations";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { transformSelectOptions } from "../../../utils/transformers";
import { RootState, AppDispatch } from "../../../store";

import SelectComponent from "../../../globalComponents/SelectComponent";
import FormWrapper from "../../../components/FormWrapper";

import "./TruckComponent.scss";
import { findTrailer } from "../../../utils/getTrailer";

interface Truck {
  id: number;
  plates: string;
}

interface Order {
  id: number;
  truck: string;
}

const isOrder = (value: unknown): value is Order => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { id?: unknown; truck?: unknown };
  return (
    typeof candidate.id === "number" && typeof candidate.truck === "string"
  );
};

const TruckComponent = () => {
  // Use AppDispatch type for dispatch
  const dispatch: AppDispatch = useDispatch();

  const trucks = useSelector(
    (state: RootState) => state.trucksInfo.trucks.data,
  ) as Truck[];
  const rawOrder = useSelector(
    (state: RootState) => state.ordersInfo.orderDetails.data,
  );
  const order = isOrder(rawOrder) ? rawOrder : null;

  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const truckOptions = transformSelectOptions(trucks, "plates");

  useEffect(() => {
    setSelectedTruck(order?.truck ?? "");

    dispatch(listTrucks());
  }, [dispatch, order]);

  const handleFormSubmit = () => {
    if (!order) {
      return;
    }

    const dataToUpdate = { truck: selectedTruck };
    const updateOrderThunk = updateOrder as unknown as (payload: {
      dataToUpdate: { truck: string };
      orderId: number;
    }) => unknown;

    dispatch(updateOrderThunk({ dataToUpdate, orderId: order.id }));
  };

  type ChangeEvent<T> = React.ChangeEvent<T>;

  const handleTruckChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTruck(e.target.value);
  };

  return (
    <>
      <FormWrapper
        disableEditMode={""}
        title="Автомобіль"
        content={
          <div className="order-details__content-row-block-value">
            <FaTruckMoving /> {selectedTruck} /{" "}
            {findTrailer(selectedTruck, trucks)}
          </div>
        }
        handleFormSubmit={handleFormSubmit}
      >
        <form>
          <SelectComponent
            label=""
            title="Виберіть авто"
            id="truck"
            name="truck"
            value={selectedTruck || ""}
            onChange={handleTruckChange}
            autoFocus
            options={truckOptions}
          />
        </form>
      </FormWrapper>
    </>
  );
};

export default TruckComponent;
