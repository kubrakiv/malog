import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaRegTrashAlt } from "react-icons/fa";
import {
  selectCustomer,
  selectCustomers,
} from "../../../features/customers/customersSelectors";
import {
  deleteCustomer,
  listCustomers,
} from "../../../features/customers/customersOperations";

import { setCustomerManagers } from "../../../features/customerManagers/customerManagersSlice";

import cn from "classnames";
import SearchComponent from "../../../globalComponents/SearchComponent";
import AddCustomerModalComponent from "../AddCustomerModalComponent";
import CustomerModalComponent from "../CustomerModalComponent";

import { setCustomerDetailsData } from "../../../features/customers/customersSlice";

import "./style.scss";

const CustomersListComponent = () => {
  const dispatch = useDispatch();
  const customers = useSelector(selectCustomers);

  useEffect(() => {
    dispatch(listCustomers());
  }, []);

  const selectedCustomer = useSelector(selectCustomer);

  const [search, setSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const handleCheckboxChange = (customerID) => {
    setSelectedCustomers((prevSelectedCustomers) => {
      if (prevSelectedCustomers.includes(customerID)) {
        return prevSelectedCustomers.filter((id) => id !== customerID);
      } else {
        return [...prevSelectedCustomers, customerID];
      }
    });
  };

  const handleRowDoubleClick = (e, customer) => {
    e.stopPropagation();
    dispatch(setCustomerDetailsData(customer));
    dispatch(setCustomerManagers(customer.managers));
    setShowCustomerModal(true);
  };

  const handleAddCustomerButton = (e) => {
    e.stopPropagation();
    setShowAddCustomerModal(true);
  };

  const handleDeleteSelectedCustomers = () => {
    if (selectedCustomers.length === 0) {
      window.alert("Виберіть замовника для видалення");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?"
    );
    if (!confirmDelete) {
      return;
    }

    if (confirmDelete) {
      try {
        for (let customerID of selectedCustomers) {
          dispatch(deleteCustomer(customerID));
          console.log("Customer deleted successfully:", customerID);
        }
        setSelectedCustomers([]);
        dispatch(listCustomers());
      } catch (error) {
        console.error("Error deleting customers:", error.message);
      }
    }
  };

  return (
    <>
      {showCustomerModal && (
        <CustomerModalComponent
          customer={selectedCustomer}
          showCustomerModal={showCustomerModal}
          setShowCustomerModal={setShowCustomerModal}
        />
      )}
      {showAddCustomerModal && (
        <AddCustomerModalComponent
          showAddCustomerModal={showAddCustomerModal}
          setShowAddCustomerModal={setShowAddCustomerModal}
        />
      )}
      <div className="drivers-container">
        <div className="drivers-header-block">
          <h2 className="drivers-table__name">Мої замовники</h2>
          <div className="drivers-header-block__buttons-container">
            <button
              className="drivers-header-block__add-driver-btn"
              title="Додати замовника"
              onClick={handleAddCustomerButton}
            >
              <FaPlus />
            </button>
            <button
              className="drivers-header-block__delete-driver-btn"
              title="Видалити вибраних замовників"
              onClick={handleDeleteSelectedCustomers}
            >
              <FaRegTrashAlt />
            </button>
          </div>
        </div>
        <SearchComponent
          search={search}
          setSearch={setSearch}
          placeholder={"Введіть назву замовника"}
        />
        <div className="table-container">
          <table className="customers-table">
            <thead className="customers-table__header">
              <tr className="customers-table__head-row">
                <th className="customers-table__head-th">ID</th>
                <th className="customers-table__head-th">Назва</th>
                <th className="customers-table__head-th">VAT Номер</th>
                <th className="customers-table__head-th">Вебсайт</th>
                <th className="customers-table__head-th">Менеджер</th>
                <th className="customers-table__head-th"></th>
              </tr>
            </thead>
            <tbody data-link="row" className="customers-table__body">
              {customers &&
                customers
                  .filter((item) => {
                    const searchTerm = search.toLowerCase();
                    return (
                      searchTerm === "" ||
                      item.name.toLowerCase().includes(searchTerm)
                    );
                  })
                  .map((customer, index) => (
                    <tr
                      key={customer.id}
                      className={cn("customers-table__body-row", {
                        "customers-table__body-row_active":
                          selectedCustomers.includes(customer.id),
                      })}
                      onDoubleClick={(e) => handleRowDoubleClick(e, customer)}
                    >
                      <td className="customers-table__body-td">{index + 1}</td>

                      <td className="customers-table__body-td">
                        {customer.name}
                      </td>
                      <td className="customers-table__body-td">
                        {customer.nip_number}
                      </td>
                      <td className="customers-table__body-td">
                        {customer.website}
                      </td>

                      <td className="customers-table__body-td">
                        {customer.managers &&
                          customer.managers.map((manager, index) => (
                            <div
                              key={`${customer.id}-${index}`}
                              className="customers-table__manager-name"
                            >
                              <span
                                key={`${customer.id}`}
                                className="customers-table__manager-name_text"
                              >
                                {manager.full_name}
                              </span>
                            </div>
                          ))}
                      </td>
                      <td className="customers-table__body-td">
                        <input
                          type="checkbox"
                          className="customers-table__checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => {
                            handleCheckboxChange(customer.id);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CustomersListComponent;
