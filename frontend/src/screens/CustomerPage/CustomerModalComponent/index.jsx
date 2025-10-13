import { useDispatch } from "react-redux";

import { listCustomers } from "../../../features/customers/customersOperations";
import {
  setAddCustomerManager,
  setShowCustomerManagerForm,
} from "../../../features/customerManagers/customerManagersSlice";

import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import CustomerCardComponent from "../CustomerCardComponent";
import { setEditModeCustomer } from "../../../features/customers/customersSlice";

const CustomerModalComponent = ({
  setShowCustomerModal,
  showCustomerModal,
  customer,
}) => {
  const dispatch = useDispatch();

  const handleCloseModal = () => {
    setShowCustomerModal(false);
    dispatch(listCustomers());
    dispatch(setAddCustomerManager(false));
    dispatch(setShowCustomerManagerForm(false));
    dispatch(setEditModeCustomer(false));
  };

  return (
    <>
      <GenericModalComponent
        title={`Замовник ${customer.name}` || "Замовник"}
        show={showCustomerModal}
        onClose={handleCloseModal}
        content={
          <CustomerCardComponent
            customer={customer}
            onCloseModal={handleCloseModal}
          />
        }
        header
      />
    </>
  );
};

export default CustomerModalComponent;
