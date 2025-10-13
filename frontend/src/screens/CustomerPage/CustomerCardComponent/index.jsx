import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  selectCustomerManager,
  selectCustomerManagers,
  selectIsEditModeCustomerManager,
  selectShowCustomerManagerForm,
} from "../../../features/customerManagers/customerManagersSelectors";

import {
  setCustomerManager,
  setCustomerManagers,
  setIsEditModeCustomerManager,
} from "../../../features/customerManagers/customerManagersSlice";
import {
  createCustomerManager,
  deleteCustomerManager,
} from "../../../features/customerManagers/customerManagersOperations";

import { selectEditModeCustomer } from "../../../features/customers/customersSelectors";

import getCustomerDetails from "./customerDetailsConfig";

import CustomerFooterComponent from "../CustomerFooterComponent";
import AddCustomerManagerComponent from "../AddCustomerManagerComponent";
import CustomerManagerCardComponent from "../CustomerManagerCardComponent";
import AddCustomerComponent from "../AddCustomerComponent";

import "./style.scss";

const CustomerCardComponent = ({ customer, onCloseModal }) => {
  const dispatch = useDispatch();
  const showCustomerManagerForm = useSelector(selectShowCustomerManagerForm);
  const customerManagers = useSelector(selectCustomerManagers);
  const isEditMode = useSelector(selectIsEditModeCustomerManager);
  const selectedManager = useSelector(selectCustomerManager);
  const editModeCustomer = useSelector(selectEditModeCustomer);

  const handleAddCustomerManager = (newManager) => {
    dispatch(createCustomerManager(newManager)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        // Manager added successfully, nothing else needs to be done since it is already in the Redux state
      }
    });
  };

  const handleEditCustomerManager = (updatedManager) => {
    const currentManagers = customerManagers;

    const updatedManagers = currentManagers.map((manager) =>
      manager.id === updatedManager.id ? updatedManager : manager
    );

    dispatch(setCustomerManagers(updatedManagers));
    console.log("Updated managers", updatedManagers);
  };

  const handleEditManager = (manager) => {
    dispatch(setCustomerManager(manager));
    dispatch(setIsEditModeCustomerManager(true));
  };

  const handleFinishEditCustomerManager = (updatedManager) => {
    if (updatedManager) {
      handleEditCustomerManager(updatedManager);
    }
    dispatch(setIsEditModeCustomerManager(false));
    dispatch(setCustomerManager({}));
  };

  const handleDeleteSelectedCustomerManager = (e, manager) => {
    e.preventDefault();
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this manager?"
    );
    if (!confirmDelete) {
      return;
    }

    dispatch(deleteCustomerManager(manager.id))
      .then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          console.log("Manager deleted successfully:", manager);
          // Optionally, you can dispatch any other actions if needed
        } else {
          console.error("Error deleting manager:", result.payload);
        }
      })
      .catch((error) => {
        console.error("Error deleting manager:", error.message);
      });
  };

  const customerDetails = getCustomerDetails(customer);

  return (
    <>
      <div className="customer-card-container">
        <div className="customer-card-details">
          <div className="customer-card-details__content">
            <div className="customer-card-details__content-block">
              <h3 className="customer-card-details__title">Дані замовника</h3>
              {!editModeCustomer &&
                customerDetails.map((detail) => (
                  <div
                    className="customer-card-details__content-row"
                    key={detail.id}
                  >
                    <div className="customer-card-details__content-row-block">
                      <div className="customer-card-details__content-row-block-title">
                        {detail.title}
                      </div>
                      <div className="customer-card-details__content-row-block-value">
                        {detail.value}
                      </div>
                    </div>
                  </div>
                ))}
              {editModeCustomer && (
                <AddCustomerComponent
                  onEditMode={editModeCustomer}
                  initialCustomerData={customer}
                  onCloseModal={onCloseModal}
                />
              )}
            </div>
            <div className="customer-card-details__content-block">
              <h3 className="customer-card-details__title">Менеджери</h3>
              {customerManagers &&
                customerManagers.map((manager) => (
                  <div key={manager.id || manager.uniqueProperty}>
                    <CustomerManagerCardComponent
                      customer={customer}
                      manager={manager}
                      onAddManager={handleAddCustomerManager}
                      onEditManager={handleEditManager}
                      isEditMode={
                        isEditMode && selectedManager.id === manager.id
                      }
                      onFinishEdit={handleFinishEditCustomerManager}
                      onDeleteManager={handleDeleteSelectedCustomerManager}
                    />
                  </div>
                ))}
              {showCustomerManagerForm && (
                <AddCustomerManagerComponent
                  customer={customer}
                  onAddManager={handleAddCustomerManager}
                />
              )}
            </div>
          </div>
          <CustomerFooterComponent onCloseModal={onCloseModal} />
        </div>
      </div>
    </>
  );
};

export default CustomerCardComponent;
