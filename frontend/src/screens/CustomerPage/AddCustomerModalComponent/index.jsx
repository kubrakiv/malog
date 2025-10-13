import { useDispatch } from "react-redux";
import { setEditModeCustomer } from "../../../features/customers/customersSlice";

import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import AddCustomerComponent from "../AddCustomerComponent";

const AddCustomerModalComponent = ({
  showAddCustomerModal,
  setShowAddCustomerModal,
}) => {
  const dispatch = useDispatch();

  const handleCloseModal = () => {
    setShowAddCustomerModal(false);
    dispatch(setEditModeCustomer(false));
  };
  return (
    <>
      <GenericModalComponent
        show={showAddCustomerModal}
        onClose={handleCloseModal}
        content={<AddCustomerComponent onCloseModal={handleCloseModal} />}
      />
    </>
  );
};

export default AddCustomerModalComponent;
