import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../../../globalComponents/ConfirmModal/useConfirm";
import { setEditModeDocument } from "../../../reducers/documentReducers";
import {
  setAddTaskMode,
  setShowTaskModal,
} from "../../../features/orders/ordersSlicers";
import { listOrderDetails } from "../../../features/orders/ordersOperations";
import { FaFileInvoiceDollar, FaTruck, FaUserAlt } from "react-icons/fa";
import EmailSenderComponent from "../../../components/EmailSenderComponent";
import cn from "classnames";

import "./ActionsComponent.scss";
import { transformDate } from "../../../utils/formatDate";
import { listInvoiceDetails } from "../../../features/invoices/invoicesOperations";
import { assignTruckAndDriver } from "../../../features/assignTruckAndDriver/assignOperations";
import { getAllRoutes } from "../../../features/orderImport/orderImportOperations";
import {
  DRIVER_SOVTES_CONSTANTS,
  TRAILER_SOVTES_CONSTANTS,
  TRUCK_SOVTES_CONSTANTS,
} from "../../../constants/global";

const ActionsComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const editModeDocument = useSelector((state) => state.documentsInfo.editMode);
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);

  const isInvoiceUpdateNeeded = useSelector(
    (state) => state.invoicesInfo.isInvoiceUpdateNeeded
  );

  const handleDocumentModalOpen = () => {
    dispatch(setEditModeDocument(!editModeDocument));
  };

  const handleAddTaskButtonClick = (e) => {
    e.stopPropagation();
    dispatch(setAddTaskMode(true));
    dispatch(setShowTaskModal(true));
  };

  const handleCreateInvoiceButtonClick = () => {
    if (!order.unloading_end_date && !order.unloading_end_time) {
      window.alert("Вкажіть дату та час завантаження/розвантаження");
      return;
    }

    if (!order.invoice) {
      navigate("/invoices/create", {
        state: { isInvoiceCreate: true, order: order },
      });
    } else if (order.invoice.id) {
      // Ensure invoice ID is defined before making API call
      dispatch(listInvoiceDetails(order.invoice.id));
      dispatch(listOrderDetails(order.id));

      navigate(`/invoices/${order.invoice.id}`, {
        state: { isInvoiceCreate: false },
      });
    }
  };

  const handleSendDataToSOVTES = async () => {
    if (!await confirm("Ви впевнені, що хочете відправити дані по авто?")) {
      return;
    }
    // const data = {
    //   route: "3747-02-25",
    //   routepartsDates: {
    //     116344796: "2025-01-27",
    //     116344797: "2025-01-28",
    //   },
    //   car: "71224",
    //   driver: "178624",
    //   trailer: "68029",
    // };
    const data = {
      route: order.order_number,
      routepartsDates: Object.fromEntries(
        order.tasks.map((task) => [task.external_id, task.start_date]) // Dynamically extracting the start_date
      ),
      car: String(TRUCK_SOVTES_CONSTANTS[order.truck_info.plates]?.id || ""),
      driver: String(
        DRIVER_SOVTES_CONSTANTS[order.driver_info.full_name]?.id || ""
      ),
      trailer: String(
        TRAILER_SOVTES_CONSTANTS[order.truck_info.trailer_details?.plates]
          ?.id || ""
      ),
    };
    console.log("Data", data);

    // Check if the response is successful
    try {
      await dispatch(assignTruckAndDriver(data)).unwrap();
      alert("Пропозиція відправлена успішно!");
    } catch (error) {
      console.error("Помилка при відправці даних до SOVTES:", error);
      alert("Сталася помилка при відправці пропозиції.");
    }
  };

  return (
    <>
      <div className="order-details__actions">
        <button
          className="order-details__action-add-task-btn"
          onClick={handleAddTaskButtonClick}
        >
          Додати завдання
        </button>
        <button
          className="order-details__action-add-documents-btn"
          onClick={handleDocumentModalOpen}
        >
          Документи
        </button>
        {!order.invoice && (
          <button
            className="order-details__action-create-invoice-btn"
            onClick={handleCreateInvoiceButtonClick}
            title="Створити інвойс"
          >
            <FaFileInvoiceDollar />
          </button>
        )}
        {order.invoice && (
          <button
            // className="order-details__action-open-invoice-btn"
            className={cn("order-details__action-open-invoice-btn", {
              "order-details__action-open-invoice-btn_update":
                isInvoiceUpdateNeeded,
            })}
            onClick={handleCreateInvoiceButtonClick}
            title="Відкрити інвойс"
          >
            {isInvoiceUpdateNeeded
              ? "Оновити інвойс № " + order.invoice.number
              : "Інвойс № " +
                order.invoice.number +
                " від " +
                transformDate(order.invoice.invoicing_date)}
          </button>
        )}
        {order.platform === "SOVTES" && (
          <button
            className="order-details__action-open-invoice-btn"
            onClick={handleSendDataToSOVTES}
            title="Відправити дані в SOVTES"
          >
            <FaTruck /> SOVTES <FaUserAlt />
          </button>
        )}
        <EmailSenderComponent />
      </div>
    </>
  );
};

export default ActionsComponent;
