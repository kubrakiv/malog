import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../../../globalComponents/ConfirmModal/useConfirm";

import * as XLSX from "xlsx"; // Import xlsx library
import { FaSave, FaTimes, FaChevronRight } from "react-icons/fa";

import { selectInvoices } from "../../../features/invoices/invoicesSelectors";
import {
  listInvoiceDetails,
  listInvoices,
  updateInvoicePaymentDate,
} from "../../../features/invoices/invoicesOperations";

import { formatNumberForExcel } from "../../../utils/formatNumber";
import { formatNumber } from "../../../features/invoices/invoiceUtils";
import { transformDate, transformDateFormat } from "../../../utils/formatDate";

import InvoiceActionsComponent from "../InvoicesListComponent/InvoiceActionsComponent";

import "./style.scss";

const InvoicesListComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const invoicesList = useSelector(selectInvoices);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [paymentDate, setPaymentDate] = useState(null);
  const [editableRowId, setEditableRowId] = useState(null); // Track editable row ID
  const [activeStatus, setActiveStatus] = useState(null); // null | "paid" | "unpaid"

  useEffect(() => {
    dispatch(listInvoices());
  }, []);

  const sortedInvoices = useMemo(
    () =>
      [...invoicesList].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),
    [invoicesList]
  );

  const dateFilteredInvoices = useMemo(
    () =>
      sortedInvoices.filter((invoice) => {
        const invoicingDate = new Date(invoice.invoicing_date);
        if (startDate && invoicingDate < startDate) return false;
        if (endDate && invoicingDate > endDate) return false;
        return true;
      }),
    [sortedInvoices, startDate, endDate]
  );

  const paidCount = dateFilteredInvoices.filter((i) => i.payment_date).length;
  const unpaidCount = dateFilteredInvoices.length - paidCount;

  const filteredInvoices = dateFilteredInvoices.filter((invoice) => {
    if (activeStatus === "paid") return !!invoice.payment_date;
    if (activeStatus === "unpaid") return !invoice.payment_date;
    return true;
  });

  // Function to handle Excel export
  const exportToExcel = async () => {
    // Check if dates are selected
    if (!startDate || !endDate) {
      alert("Ви повинні спочатку обрати дати.");
      return;
    }

    const confirmExcelExport = await confirm(
      "Ви впевнені, що хочете вивантажити таблицю в Excel?"
    );
    if (!confirmExcelExport) {
      return;
    }

    // Format data for export
    const exportData = filteredInvoices.map((invoice) => [
      transformDate(invoice.created_at),
      invoice.payment_date !== null ? "Оплачено" : "Не оплачено",
      transformDateFormat(invoice.invoicing_date),
      invoice.number,
      formatNumberForExcel(invoice.price),
      formatNumberForExcel(invoice.vat),
      formatNumberForExcel(invoice.total_price),
      invoice.currency,
      invoice.order_number,
      invoice.customer,
      invoice.service_name,
      invoice.truck,
      invoice.trailer,
      transformDateFormat(invoice.loading_date),
      transformDateFormat(invoice.unloading_date),
    ]);

    // Add header row
    const header = [
      "Дата створення",
      "Статус",
      "Дата виставлення рахунку",
      "Номер рахунку",
      "Ціна",
      "ПДВ",
      "Загальна ціна",
      "Валюта",
      "Номер замовлення",
      "Замовник",
      "Послуга",
      "Вантажівка",
      "Причіп",
      "Дата завантаження",
      "Дата розвантаження",
    ];

    // Combine header and data
    const worksheetData = [header, ...exportData];

    // Create worksheet and append data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-fit column widths
    const colWidths = worksheetData[0].map((_, colIndex) =>
      Math.max(
        ...worksheetData.map((row) =>
          row[colIndex] ? row[colIndex].toString().length : 0
        )
      )
    );
    worksheet["!cols"] = colWidths.map((width) => ({ wch: width + 1 }));

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    // Trigger download
    const fileName = `Рахунки ${transformDate(startDate)} - ${transformDate(
      endDate
    )}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handlePaymentDate = async (invoice) => {
    const dataToUpdate = {
      id: invoice.id,
      payment_date: paymentDate,
    };
    await dispatch(updateInvoicePaymentDate(dataToUpdate)).unwrap();
    dispatch(listInvoices());
    setEditableRowId(null); // Close the input field after saving
  };

  const handleInvoiceOpen = (id) => {
    dispatch(listInvoiceDetails(id));
    navigate(`/invoices/${id}`, {
      state: { isInvoiceCreate: false, invoiceFromTable: true },
    });
  };

  const handleGoToOrder = (e, orderId) => {
    e.stopPropagation();
    if (orderId) navigate(`/orders/${orderId}`);
  };

  return (
    <div className="invoices-table-container">
      <div className="invoices-table-block">
        <h2 className="table__name">Рахунки</h2>
      </div>

      <div className="inv-tabs">
        <button
          className={`inv-tab${activeStatus === null ? " inv-tab--active" : ""}`}
          onClick={() => setActiveStatus(null)}
        >
          Всі <span className="inv-tab__count">{dateFilteredInvoices.length}</span>
        </button>
        <button
          className={`inv-tab inv-tab--paid${activeStatus === "paid" ? " inv-tab--active" : ""}`}
          onClick={() => setActiveStatus("paid")}
        >
          Оплачено <span className="inv-tab__count">{paidCount}</span>
        </button>
        <button
          className={`inv-tab inv-tab--unpaid${activeStatus === "unpaid" ? " inv-tab--active" : ""}`}
          onClick={() => setActiveStatus("unpaid")}
        >
          Не оплачено <span className="inv-tab__count">{unpaidCount}</span>
        </button>
      </div>

      <InvoiceActionsComponent
        onExcelDownload={exportToExcel}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(date) => setStartDate(date)}
        onEndDateChange={(date) => setEndDate(date)}
      />

      {filteredInvoices.length === 0 ? (
        <div className="inv-empty">Рахунків не знайдено</div>
      ) : (
        <div className="inv-list">
          {filteredInvoices.map((invoice) => {
            const isPaid = !!invoice.payment_date;
            return (
              <div
                key={invoice.id}
                className="inv"
                onDoubleClick={() => handleInvoiceOpen(invoice.id)}
              >
                {/* Header */}
                <div className="inv__header">
                  <span className="inv__number">№ {invoice.number}</span>
                  <span
                    className={`inv__status-chip inv__status-chip--${isPaid ? "paid" : "unpaid"}`}
                  >
                    {isPaid ? "Оплачено" : "Не оплачено"}
                  </span>
                  <div className="inv__header-right">
                    {invoice.order_number && (
                      <span className="inv__order-num">Зам. {invoice.order_number}</span>
                    )}
                    {invoice.customer && (
                      <span className="inv__customer-name">{invoice.customer}</span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="inv__body">
                  <div className="inv__col inv__col--invoice">
                    <div className="inv__col-title">Рахунок</div>
                    <div className="inv__row">
                      <span className="inv__label">Виставлено:</span>
                      <span className="inv__value">
                        {transformDateFormat(invoice.invoicing_date)}
                      </span>
                    </div>
                    <div className="inv__row">
                      <span className="inv__label">До сплати:</span>
                      <span className="inv__value">
                        {transformDateFormat(invoice.due_date)}
                      </span>
                    </div>
                    <div className="inv__row">
                      <span className="inv__label">Оплачено:</span>
                      {invoice.payment_date ? (
                        <span className="inv__value">
                          {transformDateFormat(invoice.payment_date)}
                        </span>
                      ) : editableRowId === invoice.id ? (
                        <div
                          className="payment-date-input-wrapper"
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="date"
                            className="payment-date-input"
                            value={paymentDate || ""}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                          <button
                            type="button"
                            className="payment-date-save-btn"
                            title="Зберегти"
                            onClick={() => handlePaymentDate(invoice)}
                          >
                            <FaSave />
                          </button>
                          <button
                            type="button"
                            className="payment-date-reject-btn"
                            title="Відмінити"
                            onClick={() => setEditableRowId(null)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="inv__add-payment-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditableRowId(invoice.id);
                            setPaymentDate(null);
                          }}
                          onDoubleClick={(e) => e.stopPropagation()}
                        >
                          + Дата оплати
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="inv__col inv__col--cargo">
                    <div className="inv__col-title">Перевезення</div>
                    <div className="inv__row">
                      <span className="inv__label">Послуга:</span>
                      <span className="inv__value">{invoice.service_name || "—"}</span>
                    </div>
                    <div className="inv__row">
                      <span className="inv__label">Авто:</span>
                      <span className="inv__value inv__value--plates">
                        {invoice.truck || "—"}
                      </span>
                    </div>
                    <div className="inv__row">
                      <span className="inv__label">Причіп:</span>
                      <span className="inv__value">{invoice.trailer || "—"}</span>
                    </div>
                  </div>

                  <div className="inv__col inv__col--dates">
                    <div className="inv__col-title">Маршрут</div>
                    <div className="inv__loc">
                      <span className="inv__dot inv__dot--load" />
                      <span className="inv__city">
                        {transformDateFormat(invoice.loading_date)}
                      </span>
                    </div>
                    <div className="inv__loc">
                      <span className="inv__dot inv__dot--unload" />
                      <span className="inv__city">
                        {transformDateFormat(invoice.unloading_date)}
                      </span>
                    </div>
                  </div>

                  <div className="inv__col inv__col--finance">
                    <div className="inv__col-title">Сума</div>
                    <div className="inv__finance-line">
                      <span className="inv__label">Без ПДВ:</span>
                      <span className="inv__value">
                        {formatNumber(invoice.price)} {invoice.currency}
                      </span>
                    </div>
                    <div className="inv__finance-line">
                      <span className="inv__label">ПДВ:</span>
                      <span className="inv__value">
                        {formatNumber(invoice.vat)} {invoice.currency}
                      </span>
                    </div>
                    <div className="inv__finance-line inv__finance-line--total">
                      <span className="inv__label">Разом:</span>
                      <span className="inv__value inv__value--price">
                        {formatNumber(invoice.total_price)} {invoice.currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="inv__footer">
                  <span className="inv__created">
                    Створено: {transformDate(invoice.created_at)}
                  </span>
                  {invoice.order_id && (
                    <button
                      type="button"
                      className="inv__goto-order-btn"
                      onClick={(e) => handleGoToOrder(e, invoice.order_id)}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      Перейти до замовлення <FaChevronRight />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvoicesListComponent;
