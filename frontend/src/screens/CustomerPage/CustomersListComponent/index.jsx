import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useConfirm } from "../../../globalComponents/ConfirmModal/useConfirm";
import { FaPlus, FaRegTrashAlt, FaPencilAlt } from "react-icons/fa";
import {
  selectCustomer,
  selectCustomers,
} from "../../../features/customers/customersSelectors";
import {
  deleteCustomer,
  listCustomers,
} from "../../../features/customers/customersOperations";
import { setCustomerManagers } from "../../../features/customerManagers/customerManagersSlice";
import { setCustomerDetailsData } from "../../../features/customers/customersSlice";

import cn from "classnames";
import SearchComponent from "../../../globalComponents/SearchComponent";
import AddCustomerModalComponent from "../AddCustomerModalComponent";
import CustomerModalComponent from "../CustomerModalComponent";

import "./style.scss";

const CustomersListComponent = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const customers = useSelector(selectCustomers);
  const selectedCustomer = useSelector(selectCustomer);

  const [search, setSearch] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  useEffect(() => {
    dispatch(listCustomers());
  }, [dispatch]);

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase();
    return (customers ?? []).filter(
      (c) => q === "" || c.name?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const handleCheckboxChange = (id) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRowDoubleClick = (e, customer) => {
    e.stopPropagation();
    dispatch(setCustomerDetailsData(customer));
    dispatch(setCustomerManagers(customer.managers));
    setShowCustomerModal(true);
  };

  const handleEditSelected = () => {
    if (selectedCustomers.length !== 1) return;
    const customer = customers.find((c) => c.id === selectedCustomers[0]);
    if (!customer) return;
    dispatch(setCustomerDetailsData(customer));
    dispatch(setCustomerManagers(customer.managers));
    setShowCustomerModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0) return;
    if (!await confirm("Видалити вибраних замовників?")) return;
    for (const id of selectedCustomers) dispatch(deleteCustomer(id));
    setSelectedCustomers([]);
    dispatch(listCustomers());
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

      <div className="customers-page">
        <div className="customers-page__hero">
          <h2 className="customers-page__title">
            Замовники
            <span
              className="customers-page__info-badge"
              data-tooltip="Перегляд та керування замовниками вашої компанії."
            >
              i
            </span>
          </h2>
          <div className="customers-page__actions">
            <span className="customers-page__count-chip">
              {customers?.length ?? 0} замовників
            </span>
          </div>
        </div>

        <div className="fleet-toolbar">
          <div className="fleet-toolbar__search">
            <SearchComponent
              search={search}
              setSearch={setSearch}
              placeholder="пошук замовника"
            />
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--add"
              title="Додати замовника"
              onClick={() => setShowAddCustomerModal(true)}
              type="button"
            >
              <FaPlus />
            </button>
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--delete"
              title="Видалити вибраних"
              onClick={handleDeleteSelected}
              disabled={selectedCustomers.length === 0}
              type="button"
            >
              <FaRegTrashAlt />
            </button>
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--edit"
              title="Редагувати замовника"
              onClick={handleEditSelected}
              disabled={selectedCustomers.length !== 1}
              type="button"
            >
              <FaPencilAlt />
            </button>
          </div>
          {selectedCustomers.length > 0 && (
            <span className="fleet-toolbar__badge">
              {selectedCustomers.length} обрано
            </span>
          )}
        </div>

        <div className="customers-page__table-card">
          <div className="table-container customers-page__table-wrap">
            <table className="customers-table">
              <thead className="customers-table__header">
                <tr className="customers-table__head-row">
                  <th className="customers-table__head-th">#</th>
                  <th className="customers-table__head-th">Назва</th>
                  <th className="customers-table__head-th">VAT Номер</th>
                  <th className="customers-table__head-th">Вебсайт</th>
                  <th className="customers-table__head-th">Менеджер</th>
                  <th className="customers-table__head-th"></th>
                </tr>
              </thead>
              <tbody className="customers-table__body">
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={cn("customers-table__body-row", {
                      "customers-table__body-row--active": selectedCustomers.includes(customer.id),
                    })}
                    onClick={() => handleCheckboxChange(customer.id)}
                    onDoubleClick={(e) => handleRowDoubleClick(e, customer)}
                  >
                    <td className="customers-table__body-td">{index + 1}</td>
                    <td className="customers-table__body-td customers-table__body-td--name">
                      {customer.name}
                    </td>
                    <td className="customers-table__body-td">{customer.nip_number}</td>
                    <td className="customers-table__body-td">{customer.website}</td>
                    <td className="customers-table__body-td">
                      <div className="customers-table__managers">
                        {customer.managers?.map((manager, i) => (
                          <span key={i} className="customers-table__manager-badge">
                            {manager.full_name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="customers-table__body-td">
                      <input
                        type="checkbox"
                        className="customers-table__checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleCheckboxChange(customer.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomersListComponent;
