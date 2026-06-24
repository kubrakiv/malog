import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useConfirm } from "../../globalComponents/ConfirmModal/useConfirm";

import {
  deleteOrder,
  listOrders,
} from "../../features/orders/ordersOperations";
import { setPage } from "../../features/orders/ordersSlicers";
import { extractTime, formattedTime } from "../../utils/formattedTime";
import { listTrucks } from "../../features/trucks/trucksOperations";
import { listDrivers } from "../../actions/driverActions";
import { listCustomers } from "../../features/customers/customersOperations";
import { transformDate } from "../../utils/formatDate";
import { findTrailer } from "../../utils/getTrailer";
import { extractRoute } from "../../utils/getRoute";
import { totalDistance } from "../../utils/getTotalDistance";
import {
  calculateOrderValue,
  getTotalCostData,
} from "../../utils/calculateOrderValues";

import tableHead from "./tableHead.json";

import PricePerKmComponent from "../../screens/OrderPage/PricePerKmComponent/PricePerKmComponent";
import OrderActionsComponent from "./OrderActionsComponent";
import InvoiceStatusComponent from "./InvoiceStatusComponent";
import OrderStatusComponent from "./OrderStatusComponent";
import PaginationComponent from "../PaginationComponent";

import { FaCheck } from "react-icons/fa";
import SwitchComponent from "../SwitchComponent/SwitchComponent";

import "./OrdersTableComponent.scss";
import ProfitComponent from "../ProfitComponent";

function OrdersTableComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const {
    data: ordersData,
    count,
    currentPage,
    pageSize,
    loading,
    error,
  } = useSelector((state) => state.ordersInfo.orders);
  console.log("ordersData", ordersData);

  const trucks = useSelector((state) => state.trucksInfo.trucks.data);

  const selectedDriver = useSelector(
    (state) => state.ordersInfo.selectedDriver
  );
  const selectedTruck = useSelector((state) => state.ordersInfo.selectedTruck);
  const selectedCustomer = useSelector(
    (state) => state.ordersInfo.selectedCustomer
  );

  const [filters, setFilters] = useState({
    driver: "",
    truck: "",
    customer: "",
    start_date: null,
    end_date: null,
  });

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [hoveredOrder, setHoveredOrder] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const [hovered, setHovered] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);

  const [showAddresses, setShowAddresses] = useState(true); // New state to show/hide address fields
  const [showTruckData, setShowTruckData] = useState(true); // New state to show/hide truck data
  const [showDateTime, setShowDateTime] = useState(true); // New state to show/hide date and time fields

  let hoverTimer;

  // Fetch trucks, drivers, and customers on component mount
  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listDrivers());
    dispatch(listCustomers());
  }, []);

  useEffect(() => {
    const queryFilters = {};
    if (selectedDriver) queryFilters.driver = selectedDriver;
    if (selectedTruck) queryFilters.truck = selectedTruck;
    if (selectedCustomer) queryFilters.customer = selectedCustomer;
    if (filters.start_date)
      queryFilters.start_date = filters.start_date.toISOString().split("T")[0];
    if (filters.end_date)
      queryFilters.end_date = filters.end_date.toISOString().split("T")[0];

    dispatch(
      listOrders({ page: currentPage, pageSize, filters: queryFilters })
    );
  }, [
    dispatch,
    currentPage,
    pageSize,
    selectedDriver,
    selectedTruck,
    selectedCustomer,
    filters,
  ]);

  // useEffect(() => {
  //   dispatch(listOrders({ page: currentPage, pageSize }));
  // }, [dispatch, currentPage, pageSize]);

  const handleMouseEnter = (order) => {
    hoverTimer = setTimeout(() => {
      setHoveredOrder(order);
    }, 500);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer);
    setHoveredOrder(null);
  };

  const handleRowDoubleClick = (order) => {
    navigate(`/orders/${order.id}`);
  };

  // const handleCheckboxChange = (orderID) => {
  //   setSelectedOrders((prevSelectedOrders) => {
  //     if (prevSelectedOrders.includes(orderID)) {
  //       return prevSelectedOrders.filter((id) => id !== orderID);
  //     } else {
  //       return [...prevSelectedOrders, orderID];
  //     }
  //   });
  // };

  const handleCheckboxChange = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      window.alert("Виберіть замовлення для видалення"); // Alert if no orders are selected
      return;
    }

    const confirmDelete = await confirm(
      "Are you sure you want to delete the selected orders?"
    );
    if (!confirmDelete) {
      return; // Exit if the user cancels the deletion
    }

    if (confirmDelete) {
      try {
        for (let orderId of selectedOrders) {
          dispatch(deleteOrder(orderId)); // Dispatch delete action for each order
        }
        setSelectedOrders([]); // Clear selected orders after deletion
      } catch (error) {
        console.error("Error deleting orders:", error.message); // Handle any errors during deletion
      }
    }
  };

  // const filteredOrders = ordersData
  //   .filter((order) => {
  //     // Driver Filtering
  //     const driverSearch = selectedDriver?.toLowerCase() || ""; // Default to empty string if null
  //     return (
  //       driverSearch === "" || order.driver.toLowerCase().includes(driverSearch)
  //     );
  //   })
  //   .filter((order) => {
  //     // Truck Filtering
  //     const truckSearch = selectedTruck?.toLowerCase() || ""; // Default to empty string if null
  //     return (
  //       truckSearch === "" || order.truck.toLowerCase().includes(truckSearch)
  //     );
  //   })
  //   .filter((order) => {
  //     // Date Filtering
  //     const loadingStartDate = new Date(order.loading_start_date);
  //     if (startDate && loadingStartDate <= startDate) return false;
  //     if (endDate && loadingStartDate >= endDate) return false;
  //     return true;
  //   })
  //   .filter((order) => {
  //     // Customer Filtering
  //     const customerSearch = selectedCustomer?.toLowerCase() || ""; // Default to empty string if null
  //     return (
  //       customerSearch === "" ||
  //       order.customer.toLowerCase().includes(customerSearch)
  //     );
  //   });

  // Function to parse order number and return the components
  const parseOrderNumber = (orderNumber) => {
    const [incremental, month, year] = orderNumber
      .split("-")
      .map((value, index) => (index === 0 ? Number(value) : Number(value)));
    // Assume the year is in the format '24', representing 2024
    const fullYear = year < 50 ? 2000 + year : 1900 + year; // Adjust year parsing logic as needed
    return { incremental, month, fullYear };
  };

  const totalPages = Math.ceil(count / pageSize);

  // const sortedOrdersDescending = filteredOrders; // Already paginated & sorted from backend

  return (
    <>
      <div className="orders-table-container">
        <div className="orders-header-block">
          <h2 className="table__name">Поточні замовлення</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <SwitchComponent
              type="orders-table"
              isToggled={showTruckData}
              onToggle={() => setShowTruckData(!showTruckData)}
              title="Truck"
            />
            <SwitchComponent
              type="orders-table"
              isToggled={showDateTime}
              onToggle={() => setShowDateTime(!showDateTime)}
              title="Date"
            />
            <SwitchComponent
              type="orders-table"
              isToggled={showAddresses}
              onToggle={() => setShowAddresses(!showAddresses)}
              title="Route"
            />
          </div>
        </div>
        <OrderActionsComponent
          onDelete={handleDeleteSelectedOrders}
          selectedDriver={selectedDriver}
          selectedTruck={selectedTruck}
          selectedCustomer={selectedCustomer}
          // startDate={startDate}
          // endDate={endDate}
          // onStartDateChange={(date) => setStartDate(date)}
          // onEndDateChange={(date) => setEndDate(date)}
          startDate={filters.start_date}
          endDate={filters.end_date}
          onStartDateChange={(date) =>
            setFilters((prev) => ({ ...prev, start_date: date }))
          }
          onEndDateChange={(date) =>
            setFilters((prev) => ({ ...prev, end_date: date }))
          }
        />
        {loading ? (
          <h3>Loading</h3>
        ) : error ? (
          <h4>{error}</h4>
        ) : (
          <div className="table-container">
            <table className="orders-table">
              <thead className="orders-table__header">
                <tr className="orders-table__header-row">
                  {tableHead
                    .filter((col) => {
                      if (!showAddresses) {
                        // Hide specific columns based on toggle state
                        return (
                          col["Loading Address"] !== "Loading Address" &&
                          col["Unloading Address"] !== "Unloading Address"
                        );
                      }
                      return true;
                    })
                    .filter((col) => {
                      if (!showDateTime) {
                        // Hide specific columns based on toggle state
                        return (
                          col["Loading Date"] !== "Loading Date" &&
                          col["Loading Time"] !== "Loading Time" &&
                          col["Unloading Date"] !== "Unloading Date" &&
                          col["Unloading Time"] !== "Unloading Time"
                        );
                      }
                      return true;
                    })
                    .filter((col) => {
                      if (!showTruckData) {
                        // Hide specific columns based on toggle state
                        return (
                          col["Truck"] !== "Truck" &&
                          col["Driver"] !== "Driver" &&
                          col["Trailer"] !== "Trailer"
                        );
                      }
                      return true;
                    })
                    .map((col, index) => (
                      <th key={index} className="orders-table__header-th">
                        {Object.values(col)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="orders-table__body">
                {ordersData.map((order) => (
                  <tr
                    key={order.id}
                    className="orders-table__body-row"
                    onDoubleClick={() => handleRowDoubleClick(order)}
                  >
                    <td className="orders-table__body-td">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleCheckboxChange(order.id)}
                      />
                    </td>
                    {/* Order status */}
                    <td className="orders-table__body-td">
                      {/* <OrderStatusComponent order={order} /> */}
                      {order.current_status ? (
                        <span
                          style={{ textTransform: "capitalize", width: "100%" }}
                          className={`order-status ${"green"}`}
                        >
                          {order.current_status.status}
                        </span>
                      ) : (
                        <span></span>
                      )}
                    </td>
                    {/* Invoice status */}
                    <td className="orders-table__body-td">
                      <InvoiceStatusComponent order={order} />
                    </td>
                    {/* Documents status */}
                    <td className="orders-table__body-td">
                      {(() => {
                        const documentStatus = order?.status_history.find(
                          (status) => status.status === "documents_sent"
                        );

                        if (documentStatus) {
                          const { started_at } = documentStatus;
                          return (
                            <>
                              <span>Sent</span>
                              <br />
                              <span>{transformDate(started_at)}</span>
                              <br />
                              <span>at {extractTime(started_at)}</span>
                            </>
                          );
                        }

                        return <FaCheck style={{ color: "red" }} />;
                      })()}
                    </td>

                    <td className="orders-table__body-td">
                      {extractRoute(order)}
                    </td>
                    <td
                      className="orders-table__body-td"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {order.number}
                    </td>
                    {showAddresses && (
                      <td
                        className="orders-table__body-td"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {order.tasks &&
                          order.tasks
                            .filter((task) => task.type === "Loading")
                            .map((task) => (
                              <div key={task.id}>
                                {task.point_details?.country_short}-
                                {task.point_details?.postal_code}{" "}
                                {task.point_details?.city}
                              </div>
                            ))}
                      </td>
                    )}
                    {showAddresses && (
                      <td
                        className="orders-table__body-td"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {order.tasks &&
                          order.tasks
                            .filter((task) => task.type === "Unloading")
                            .map((task) => (
                              <div key={task.id}>
                                {task.point_details?.country_short}-
                                {task.point_details?.postal_code}{" "}
                                {task.point_details?.city}
                              </div>
                            ))}
                      </td>
                    )}
                    <td
                      className="orders-table__body-td"
                      onMouseEnter={() => handleMouseEnter(order)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      {hoveredOrder && hoveredOrder.id === order.id
                        ? order.customer_manager
                        : order.customer}
                    </td>
                    <td
                      className="orders-table__body-td"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {order.order_number}
                    </td>
                    <td className="orders-table__body-td">
                      {order.payment_period}
                    </td>
                    <td className="orders-table__body-td">
                      {order.user && order.user.full_name}
                    </td>
                    <td className="orders-table__body-td">{order.platform}</td>

                    {showTruckData && (
                      <td className="orders-table__body-td">{order.driver}</td>
                    )}
                    {showTruckData && (
                      <td className="orders-table__body-td">{order.truck}</td>
                    )}
                    {showTruckData && (
                      <td className="orders-table__body-td">
                        {findTrailer(order.truck, trucks)}
                      </td>
                    )}
                    {showDateTime && (
                      <td className="orders-table__body-td">
                        {order.loading_end_date
                          ? transformDate(order.loading_end_date)
                          : transformDate(order.loading_start_date)}
                      </td>
                    )}
                    {showDateTime && (
                      <td className="orders-table__body-td">
                        {order.loading_end_time ? (
                          formattedTime(order.loading_end_time)
                        ) : (
                          <FaCheck style={{ color: "red" }} />
                        )}
                      </td>
                    )}
                    {showDateTime && (
                      <td className="orders-table__body-td">
                        {order.unloading_end_date
                          ? transformDate(order.unloading_end_date)
                          : transformDate(order.unloading_start_date)}
                      </td>
                    )}
                    {showDateTime && (
                      <td className="orders-table__body-td">
                        {order.unloading_end_time ? (
                          formattedTime(order.unloading_end_time)
                        ) : (
                          <FaCheck style={{ color: "red" }} />
                        )}
                      </td>
                    )}
                    <td className="orders-table__body-td">
                      {order.empty_distance}
                    </td>
                    <td className="orders-table__body-td">
                      {totalDistance(order)}
                    </td>
                    <td
                      className="orders-table__body-td"
                      style={{ textAlign: "right", whiteSpace: "nowrap" }}
                    >
                      {order.price}
                    </td>
                    <td className="orders-table__body-td">{order.currency}</td>
                    <td className="orders-table__body-td">
                      {getTotalCostData(order).costPerKm}
                    </td>
                    <td className="orders-table__body-td">
                      <div>
                        <PricePerKmComponent
                          type={"table"}
                          price={order.market_price || order.price || 0}
                          distance={totalDistance(order)}
                          currency={order.currency}
                        />
                      </div>
                    </td>
                    <td
                      className="orders-table__body-td"
                      style={{ textAlign: "right", whiteSpace: "nowrap" }}
                    >
                      {order.market_price}
                    </td>
                    <td className="orders-table__body-td">
                      {calculateOrderValue(order, "Direct Costs, EUR")}
                    </td>
                    <td className="orders-table__body-td">
                      {calculateOrderValue(order, "Tolls, EUR")}
                    </td>
                    <td className="orders-table__body-td">
                      {calculateOrderValue(order, "Маржа, EUR")}
                    </td>
                    <td className="orders-table__body-td">
                      {calculateOrderValue(order, "Маржа, %")}%
                    </td>
                    <td
                      className="orders-table__body-td"
                      style={{ textAlign: "right", whiteSpace: "nowrap" }}
                    >
                      <ProfitComponent order={order} type={"value"} />
                    </td>
                    <td
                      className="orders-table__body-td"
                      style={{ textAlign: "right", whiteSpace: "nowrap" }}
                    >
                      <ProfitComponent order={order} type={"percent"} />
                    </td>

                    <td className="orders-table__body-td">
                      {order.invoice && order.invoice.number}
                    </td>
                    <td className="orders-table__body-td">
                      {order.invoice &&
                        transformDate(order.invoice.invoicing_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {count > pageSize && (
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => dispatch(setPage(page))}
          />
        )}
      </div>
    </>
  );
}

export default OrdersTableComponent;
