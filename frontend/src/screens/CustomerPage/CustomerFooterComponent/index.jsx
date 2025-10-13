import { useSelector, useDispatch } from "react-redux";
import {
  setAddCustomerManager,
  setShowCustomerManagerForm,
} from "../../../features/customerManagers/customerManagersSlice";
import { selectIsAddCustomerManager } from "../../../features/customerManagers/customerManagersSelectors";
import { setEditModeCustomer } from "../../../features/customers/customersSlice";
import { selectEditModeCustomer } from "../../../features/customers/customersSelectors";

const CustomerFooterComponent = ({ onCloseModal }) => {
  const dispatch = useDispatch();
  const isAddCustomerManager = useSelector(selectIsAddCustomerManager);
  const editModeCustomer = useSelector(selectEditModeCustomer);

  const toggleEditMode = (e) => {
    e.preventDefault();
    dispatch(setEditModeCustomer(!editModeCustomer));
  };

  const handleAddCustomerManagerButton = (e) => {
    e.preventDefault();
    dispatch(setShowCustomerManagerForm(true));
    dispatch(setAddCustomerManager(true));
  };

  const handleCloseAddCustomerManager = () => {
    dispatch(setShowCustomerManagerForm(false));
    dispatch(setAddCustomerManager(false));
  };

  return (
    <>
      <div className="end-time__footer">
        <button
          title="Редагувати замовника"
          className="order-details__footer-btn order-details__footer-btn_edit"
          onClick={toggleEditMode}
          style={{ position: "absolute", left: "5px" }}
        >
          {!editModeCustomer ? "Редагувати замовника" : "Завершити редагування"}
        </button>
        {!isAddCustomerManager ? (
          <button
            title="Додати менеджера"
            className="end-time__footer-btn end-time__footer-btn_save"
            onClick={handleAddCustomerManagerButton}
          >
            Додати менеджера
          </button>
        ) : (
          <button
            title="Завершити"
            className="end-time__footer-btn end-time__footer-btn_edit"
            onClick={handleCloseAddCustomerManager}
          >
            Завершити
          </button>
        )}

        <button
          title="Закрити вікно"
          className="end-time__footer-btn end-time__footer-btn_close"
          onClick={(e) => {
            e.preventDefault();
            onCloseModal();
          }}
        >
          Закрити
        </button>
      </div>
    </>
  );
};

export default CustomerFooterComponent;
