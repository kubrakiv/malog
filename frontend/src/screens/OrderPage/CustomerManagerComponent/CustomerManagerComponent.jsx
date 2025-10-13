import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaRegUser } from "react-icons/fa";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { transformSelectOptions } from "../../../utils/transformers";
// import { createSelector } from "reselect";

import FormWrapper from "../../../components/FormWrapper";
import SelectComponent from "../../../globalComponents/SelectComponent";

import "./CustomerManagerComponent.scss";
import { selectManagers } from "../../../features/customers/customersSelectors";

function CustomerManagerComponent() {
  const dispatch = useDispatch();

  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const managers = useSelector(selectManagers);

  const [selectedManager, setSelectedManager] = useState(
    order.customer_manager || ""
  );

  // Memoize the managerOptions to avoid recreating the array on each render
  const managerOptions = useMemo(
    () => transformSelectOptions(managers, "full_name"),
    [managers]
  );

  const manager = managers?.find(
    (manager) => manager.full_name === order.customer_manager
  );

  const handleFormSubmit = () => {
    let dataToUpdate = {
      customer_manager: selectedManager.trim(),
    };
    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
  };

  return (
    <>
      <FormWrapper
        title="Менеджер замовника"
        hiddenContent={
          <>
            <div className="order-details__content-row-block-value">
              &#128386;
              {manager?.email}
            </div>
            <div className="order-details__content-row-block-value">
              &#9990;
              {manager?.phone}
            </div>
          </>
        }
        content={
          <>
            {manager && (
              <>
                <div className="order-details__content-row-block-value">
                  <FaRegUser /> {manager?.full_name || manager}
                </div>
              </>
            )}
          </>
        }
        handleFormSubmit={handleFormSubmit}
      >
        <form>
          <SelectComponent
            title="Виберіть менеджера"
            id="manager"
            name="manager"
            value={selectedManager || ""}
            onChange={(e) => setSelectedManager(e.target.value)}
            options={managerOptions}
          />
        </form>
      </FormWrapper>
    </>
  );
}

export default CustomerManagerComponent;
