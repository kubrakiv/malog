import { useEffect, useState } from "react";
import { FaPencilAlt, FaPlus, FaRegTrashAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCustomers } from "../../../features/customers/customersSelectors";
import { listCustomers } from "../../../features/customers/customersOperations";

import cn from "classnames";
import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import SearchComponent from "../../../globalComponents/SearchComponent";
import CustomerCardComponent from "../CustomerCardComponent";
import AddCustomerComponent from "../AddCustomerComponent";

import "./style.scss";

const CustomersComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customers = useSelector(selectCustomers);

  useEffect(() => {
    dispatch(listCustomers());
  }, []);

  const [selectedCustomer, setSelectedCustomer] = useState({});
  const [search, setSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // All edit mode hooks
  const [editCustomerMode, setEditCustomerMode] = useState(false);

  const handleCheckboxChange = (customerID) => {
    setSelectedCustomers((prevSelectedCustomers) => {
      if (prevSelectedCustomers.includes(customerID)) {
        return prevSelectedCustomers.filter((id) => id !== customerID);
      } else {
        return [...prevSelectedCustomers, customerID];
      }
    });
  };

  console.log("Customers", customers);

  const handleEditCustomerMode = (e) => {
    e.preventDefault();

    if (selectedCustomers.length === 0) {
      window.alert("Виберіть замовника для редагування");
    } else if (selectedCustomers.length > 1) {
      window.alert("Виберіть лише одного замовника для редагування");
    }
    if (selectedCustomers.length === 1) {
      setSelectedCustomer(
        customers.find((customer) => customer.id === selectedCustomers[0])
      );
      setEditCustomerMode(true);
      // setShowCustomerModal(true);
    }
  };

  const handleRowDoubleClick = (e, customer) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    console.log("Selected customer", customer);
    setShowCustomerModal(true);
  };

  const handleAddCustomerButton = (e) => {
    e.stopPropagation();
    setSelectedCustomer({});
    console.log("Add customer button clicked");
    // navigate("/customers/add");
    setShowAddCustomerModal(true);
  };

  const handleDeleteSelectedCustomers = () => {
    console.log("Delete selected customers", selectedCustomers);
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
      console.log("Delete selected drivers", selectedCustomers);
      try {
        for (let customerID of selectedCustomers) {
          // dispatch(deleteCustomer(customerID));
          console.log("Customer deleted successfully:", customerID);
        }
        setSelectedCustomers([]);
      } catch (error) {
        console.error("Error deleting drivers:", error.message);
      }
    }
  };

  return (
    <>
      {showCustomerModal && (
        <GenericModalComponent
          title={`Замовник ${selectedCustomer.name}` || "Замовник"}
          show={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          content={<CustomerCardComponent customer={selectedCustomer} />}
          footer
          header
        />
      )}
      {showAddCustomerModal && (
        <GenericModalComponent
          show={showAddCustomerModal}
          onClose={() => setShowAddCustomerModal(false)}
          content={<AddCustomerComponent />}
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
            <button
              className="drivers-header-block__edit-driver-btn"
              title="Редагувати вибраного замовника"
              onClick={handleEditCustomerMode}
            >
              <FaPencilAlt />
            </button>
            {/* TODO: Add this buttons block to globalComponents */}
          </div>
        </div>
        <SearchComponent
          search={search}
          setSearch={setSearch}
          placeholder={"Введіть назву замовника"}
        />
        <div className="table-container">
          <table className="drivers-table">
            <thead className="drivers-table__header">
              <tr className="drivers-table__head-row">
                <th className="drivers-table__head-th">ID</th>
                <th className="drivers-table__head-th">Назва</th>
                <th className="drivers-table__head-th">Номер</th>
                <th className="drivers-table__head-th">Вебсайт</th>
                <th className="drivers-table__head-th">Менеджер</th>
                <th className="drivers-table__head-th"></th>
              </tr>
            </thead>
            <tbody data-link="row" className="drivers-table__body">
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
                      className={cn("drivers-table__body-row", {
                        "drivers-table__body-row_active":
                          selectedCustomers.includes(customer.id),
                      })}
                      onDoubleClick={(e) => handleRowDoubleClick(e, customer)}
                    >
                      <td className="drivers-table__body-td">{index + 1}</td>

                      <td className="drivers-table__body-td">
                        {customer.name}
                      </td>
                      <td className="drivers-table__body-td">
                        {customer.nip_number}
                      </td>
                      <td className="drivers-table__body-td">
                        {customer.website}
                      </td>
                      <td className="drivers-table__body-td">
                        {customer.managers &&
                          customer.managers.map((manager) => (
                            <span key={`${customer.id}-${manager.id}`}>
                              {manager.full_name}
                            </span>
                          ))}
                      </td>
                      <td className="drivers-table__body-td">
                        <input
                          type="checkbox"
                          className="drivers-table__checkbox"
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

export default CustomersComponent;
