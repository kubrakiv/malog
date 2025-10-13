import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { setCustomerDetailsData } from "../../features/customers/customersSlice";
import { calculateDueDate, transformDate } from "../../utils/formatDate";
import { findTrailer } from "../../utils/getTrailer";
import { FaArrowLeft, FaFilePdf } from "react-icons/fa";
import {
  createInvoice,
  listInvoiceDetails,
  updateInvoice,
} from "../../features/invoices/invoicesOperations";
import { listOrderDetails } from "../../features/orders/ordersOperations";
import {
  compareInvoiceWithOrder,
  renderRouteTitle,
  totalPrice,
  formatNumber,
} from "../../features/invoices/invoiceUtils";
import { setInvoiceUpdateNeeded } from "../../features/invoices/invoicesSlice";
import { listCustomers } from "../../features/customers/customersOperations";

import { listCurrencies } from "../../features/currencies/currenciesOperations";
import { selectCurrencies } from "../../features/currencies/currenciesSelectors";
import { listTrucks } from "../../features/trucks/trucksOperations";

import stampDelta from "./stamp_delta_horizontal.png";

import "./style.scss";

const { REACT_APP_COMPANY_CURRENCY: COMPANY_CURRENCY } = import.meta.env;

const InvoiceComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isInvoiceUpdateNeeded = useSelector(
    (state) => state.invoicesInfo.isInvoiceUpdateNeeded
  );

  const isInvoiceCreate = location.state.isInvoiceCreate;
  const orderState = location.state.order;
  const invoiceFromTable = location.state.invoiceFromTable;

  const orderStore = useSelector((state) => state.ordersInfo.orderDetails.data);

  const order = useMemo(() => {
    if (isInvoiceCreate) {
      return orderState;
    } else {
      return orderStore;
    }
  }, []);

  const initialInvoiceData = useSelector(
    (state) => state.invoicesInfo.invoiceDetails.data
  );

  const { invoiceId } = useParams();

  const customers = useSelector((state) => state.customersInfo.customers.data);
  const currencies = useSelector(selectCurrencies);

  const customer = useSelector((state) => state.customersInfo.customer.data);
  const trucks = useSelector((state) => state.trucksInfo.trucks.data);
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const getCurrencyId = (currencyName) => {
    return currencies.find((currency) => currency.short_name === currencyName)
      ?.id;
  };

  const invoiceDataFromDB = useMemo(() => {
    if (initialInvoiceData) {
      return {
        ...initialInvoiceData,
      };
    }
  }, [initialInvoiceData]);

  useEffect(() => {
    const orderId = order?.id || invoiceDataFromDB?.order_id;
    console.log("Fetching order with ID:", orderId);
    if (orderId) {
      dispatch(listOrderDetails(orderId));
    }
    dispatch(listCustomers());
    dispatch(listCurrencies());
    dispatch(listTrucks());
    if (invoiceId) {
      dispatch(listInvoiceDetails(invoiceId));
    }
  }, [dispatch, invoiceId, invoiceDataFromDB?.order_id, order?.id]);

  const invoiceDataFromOrder = useMemo(() => {
    if (order) {
      const trailer = order?.truck ? findTrailer(order?.truck, trucks) : "";
      return {
        invoice_number: order?.invoice?.number,
        service_name: renderRouteTitle(order),
        truck: order?.truck,
        trailer,
        loading_date: order?.loading_end_date,
        unloading_date: order?.unloading_end_date,
        order_number: order?.order_number,
        company_id: 1,
        order_id: order?.id,
        price: parseFloat(order?.price),
        vat: order?.vat ? parseFloat(order.price) * 0.21 : 0,
        total_price: parseFloat(totalPrice(order?.vat, order.price)),
        currency: order?.currency,
        currency_rate: parseFloat(COMPANY_CURRENCY),
        customer: order?.customer,
        customer_id: customer?.id,
        invoicing_date: order?.unloading_end_date,
        vat_date: order?.unloading_end_date,
        due_date: calculateDueDate(
          order?.unloading_end_date,
          order?.payment_period
        ),
        send_date: null,
        accepted_date: null,
        payment_date: null,
        user: userInfo?.id,
      };
    }
  }, [order, trucks]);

  const invoiceData = orderState ? invoiceDataFromOrder : invoiceDataFromDB;

  useEffect(() => {
    if (order && invoiceData) {
      const trailer = order?.truck ? findTrailer(order?.truck, trucks) : "";
      const orderData = {
        ...order,
        trailer: trailer,
      };
      const isUpdateNeeded = compareInvoiceWithOrder(
        orderData,
        invoiceDataFromDB
      );
      dispatch(setInvoiceUpdateNeeded(isUpdateNeeded));
    }
  }, [order, invoiceData]);

  useEffect(() => {
    if (invoiceData) {
      const customer = customers.find(
        (cust) => cust.name === invoiceData.customer
      );
      dispatch(setCustomerDetailsData(customer));
    }
  }, [customers, invoiceData]);

  const handleDownloadPDF = () => {
    const element = document.getElementById("invoice");

    html2canvas(element, {
      scale: 3,
      onclone: (clonedDoc) => {
        const hideElement = (id) => {
          const el = clonedDoc.getElementById(id);
          if (el) el.style.display = "none";
        };

        hideElement("downloadButton");
        hideElement("returnButton");

        if (!order.invoice) hideElement("saveInvoiceButton");
        if (!invoiceData) hideElement("updateInvoiceButton");
        if (initialInvoiceData) hideElement("createdInfo");

        // // Hide the button in the cloned document for PDF generation
        // clonedDoc.getElementById("downloadButton").style.display = "none";
        // clonedDoc.getElementById("returnButton").style.display = "none";
        // !order.invoice
        //   ? (clonedDoc.getElementById("saveInvoiceButton").style.display =
        //       "none")
        //   : null;
        // !invoiceData
        //   ? (clonedDoc.getElementById("updateInvoiceButton").style.display =
        //       "none")
        //   : null;
        // initialInvoiceData
        //   ? (clonedDoc.getElementById("createdInfo").style.display = "none")
        //   : null;
      },
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");

      // const pdf = new jsPDF("p", "mm", "a4");
      const pdf = new jsPDF({ compress: true });
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      // Add the stamp (adjust X, Y, width, height as needed)
      pdf.addImage(stampDelta, "PNG", 90, 250, 70, 30); // Adjust coordinates and size

      console.log("Order unloading date:", order.unloading_end_date);
      console.log("Invoice data:", invoiceData);
      pdf.save(
        `Invoice_${invoiceData?.number || ""}_${transformDate(
          invoiceData.unloading_date
        )}.pdf`
      );
    });
  };

  const handleGoBack = () => {
    if (location.state?.fromOrder) {
      navigate(`/orders/${order.id}`); // Replace `/orders/${order.id}` with your order page URL
    } else {
      navigate(-1); // Default behavior
    }
  };

  const handleCreateInvoice = async () => {
    // Parse and validate price
    const parsedPrice = parseFloat(order.price);
    if (isNaN(parsedPrice)) {
      console.error("Invalid price:", order.price);
      return;
    }

    // Determine VAT amount and total price
    const vatAmount = order.vat ? parsedPrice * 0.21 : 0;
    const totalPriceValue = order.vat
      ? (parsedPrice + vatAmount).toFixed(2)
      : parsedPrice.toFixed(2);

    let newInvoiceData = {
      invoice_number: "",
      service_name: renderRouteTitle(order),
      truck: order.truck,
      trailer: findTrailer(order.truck, trucks),
      loading_date: order.loading_end_date,
      unloading_date: order.unloading_end_date,
      order_number: order.order_number,
      company_id: 1,
      order_id: order.id,
      price: parseFloat(order.price),
      vat: order.vat ? order.price * 0.21 : 0,
      total_price: parseFloat(totalPriceValue),
      currency: getCurrencyId(order?.currency),
      currency_rate: parseFloat(COMPANY_CURRENCY).toFixed(3),
      customer_id: customer.id,
      invoicing_date: order.unloading_end_date,
      vat_date: order.unloading_end_date,
      due_date: calculateDueDate(
        order.unloading_end_date,
        order.payment_period
      ),
      send_date: null,
      accepted_date: null,
      payment_date: null,
      user: userInfo.id,
    };

    console.log("New invoice data", newInvoiceData);
    try {
      const response = await dispatch(createInvoice(newInvoiceData)).unwrap();
      dispatch(listOrderDetails(order.id));
      if (response?.id) {
        navigate(`/invoices/${response.id}`, { state: { fromOrder: true } });
      } else {
        console.error("Failed to create invoice: Missing invoice ID");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  const handleUpdateInvoice = () => {
    if (!invoiceDataFromOrder || !invoiceDataFromDB) {
      console.error("Missing data for updating the invoice.");
      return;
    }

    const normalizeValue = (value, key) => {
      // Ensure `vat` is not normalized to a string or empty value
      if (key === "vat") {
        return value === true || value === false ? value : false; // Default to `false` if invalid
      }
      return value === null || value === undefined ? "" : String(value);
    };

    // Identify fields that have changed
    const updatedFields = Object.keys(invoiceDataFromOrder).reduce(
      (changes, key) => {
        if (key === "currency") {
          const newCurrencyId = getCurrencyId(order?.currency);
          if (newCurrencyId !== invoiceDataFromDB.currency) {
            changes[key] = newCurrencyId;
          }
        } else if (
          normalizeValue(invoiceDataFromOrder[key]) !==
          normalizeValue(invoiceDataFromDB[key])
        ) {
          changes[key] = invoiceDataFromOrder[key];
        }
        return changes;
      },
      {}
    );

    if (Object.keys(updatedFields).length === 0) {
      console.log("No changes detected in the invoice.");
      return;
    }

    console.log("Updated fields:", updatedFields);

    // Merge data from order (base) with existing invoice data (DB)
    // Merge updates with DB data
    const updatedInvoiceData = {
      ...invoiceDataFromDB,
      ...updatedFields,
    };

    console.log("Updated Invoice Data:", updatedInvoiceData);

    // Dispatch update action
    dispatch(updateInvoice(updatedInvoiceData))
      .then(() => {
        console.log("Invoice updated successfully:", updatedInvoiceData);
        dispatch(listOrderDetails(order.id));
        dispatch(listInvoiceDetails(invoiceId));
      })
      .catch((error) => {
        console.error("Failed to update invoice:", error);
      });
  };

  return (
    <div
      id="invoice"
      className="invoice"
      style={{
        padding: "20px",
        paddingTop: "10px",
        paddingBottom: "50px",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        lineHeight: "1.4",
        width: "800px",
        margin: "0 auto",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      {/* Show Invoice Created Message */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          height: "35px",
        }}
      >
        <div
          id="returnButton"
          className="invoice__return-btn"
          onClick={handleGoBack}
          title="Go back"
        >
          <FaArrowLeft />
        </div>
        {initialInvoiceData && !isInvoiceCreate && (
          <div id="createdInfo" className="invoice__created-info">
            Invoice created at {transformDate(invoiceData.created_at)}
          </div>
        )}
        {!invoiceId && (
          <button
            type="button"
            id="saveInvoiceButton"
            className="invoice__save-invoice-btn"
            onClick={handleCreateInvoice}
            title="Створити інвойс"
          >
            Зберегти інвойс
          </button>
        )}

        {/* Download PDF Button */}
        <button
          type="button"
          onClick={handleDownloadPDF}
          id="downloadButton"
          className="invoice__create-pdf-btn"
          title="Створити PDF файл"
        >
          <FaFilePdf />
        </button>
      </div>
      {/* Invoice Actions */}
      <div className="invoice__actions">
        {/* Update Invoice Button */}
        {invoiceData &&
          isInvoiceUpdateNeeded &&
          !isInvoiceCreate &&
          !invoiceFromTable && (
            <button
              type="button"
              id="updateInvoiceButton"
              className="invoice__update-invoice-btn"
              onClick={handleUpdateInvoice}
              title="Оновити інвойс"
            >
              Оновити інвойс
            </button>
          )}
      </div>

      {/* Invoice Header */}
      <div style={{ textAlign: "right", marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "10px" }}>
          INVOICE No {invoiceData?.number}
        </h3>
        <div style={{ fontSize: "12px" }}>
          <strong>Contract:</strong> Objednávka č. (Transport Order Nr.):
        </div>
        <div style={{ fontSize: "12px" }}>
          <strong>{invoiceData?.order_number || ""}</strong>
        </div>
      </div>

      {/* Customer Details */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid black",
          paddingBottom: "10px",
        }}
      >
        <div style={{ width: "70%" }}>
          <strong>Dodavatel (Consignor):</strong>
          <br />
          DELTA LOGISTICS s.r.o.
          <br />
          Kodymova 2536/14 Stodulky,
          <br />
          158 00 Praha 5, Czech Republic
          <br />
          IČ (CRN): 24295540
          <br />
          DIČ (VAT): CZ24295540
          <br />
          Mobil: +420777724257, +420607106698
          <br />
          E-mail: lenex@email.cz
          <br />
          <strong>Bank details:</strong>
          <br />
          Ceska sporitelna, a.s.
          <br />
          Olbrachtova 1929/62, 140 000 Praha 4, Czech Republic
          <br />
          {invoiceData?.currency === "EUR"
            ? "IBAN: CZ78 0800 0000 0000 0785 7082 (for EUR)"
            : "IBAN: CZ96 0800 0000 0000 0785 6952 (for CZK)"}
          <br />
          {invoiceData?.currency === "EUR"
            ? "č.ú. (Account Nr.): 7857082/0800 (EUR)"
            : "č.ú. (Account Nr.): 7857082/0800 (CZK)"}
          <br />
          SWIFT (BIC): GIBACZPX
          <br />
        </div>
        <div style={{ textAlign: "left", width: "50%" }}>
          <strong>Odběratel (Consignee):</strong>
          <br />
          {customer?.name}
          <br />
          {customer?.nip_number}
          <br />
          {customer?.post_address}
          <br />
          {customer?.email}
          <br />
          {customer?.phone}
        </div>
      </div>

      {/* Invoice Dates */}
      <div
        style={{
          display: "flex",
          justifyContent: "left",
          gap: "20px",
          paddingTop: "10px",
          borderBottom: "1px solid black",
          paddingBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingTop: "10px",
            paddingBottom: "10px",
            gap: "5px",
          }}
        >
          <div>
            <strong>Datum vystaveni: (Date of invoicing)</strong>
          </div>
          <div>
            <strong>Datum uskutečnění plnění: (VAT Date)</strong>{" "}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingTop: "10px",
            paddingBottom: "10px",
            gap: "5px",
          }}
        >
          <div>{transformDate(invoiceData?.invoicing_date)}</div>
          <div>{transformDate(invoiceData?.vat_date)}</div>
        </div>
      </div>

      {/* Invoice Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
          borderBottom: "1px solid black",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid black" }}>
            <th>Označení dodávky (Service name)</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Price {invoiceData?.currency}</th>
            <th>VAT</th>
            <th>Gross value</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: "50px", textAlign: "center" }}>
            <td
              style={{
                width: "55%",
                wordWrap: "break-word",
                whiteSpace: "normal",
              }}
            >
              Transportation:
              <br />
              <span>{invoiceData?.service_name}</span>
            </td>
            <td>1</td>
            <td>TIR</td>
            <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
              {formatNumber(invoiceData?.price)}
            </td>
            <td>{parseInt(invoiceData?.vat) !== 0 ? "21%" : "0%"}</td>
            <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
              {formatNumber(totalPrice(invoiceData?.vat, invoiceData?.price))}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Invoice Trucks details */}
      <div
        style={{
          display: "flex",
          justifyContent: "left",
          marginTop: "10px",
          marginBottom: "20px",
          gap: "20px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              gap: "20px",
            }}
          >
            <strong>Loading date:</strong>
            <span>{transformDate(invoiceData?.loading_date)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <strong>Unloading date:</strong>
            <span>{transformDate(invoiceData?.unloading_date)}</span>
          </div>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              gap: "20px",
            }}
          >
            <strong>Truck No.:</strong>
            <span>{invoiceData?.truck}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <strong>Trailer No.:</strong>
            <span>{invoiceData?.trailer}</span>
          </div>
        </div>
      </div>

      {/* VAT Tables */}
      {parseInt(invoiceData.vat) !== 0 && (
        <>
          <div style={{ marginTop: "20px" }}>
            {/* Top Row Tables */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {/* Left Table: Přehled DPH */}
              <div
                style={{
                  border: "1px solid black",
                  width: "60%",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "12px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "center",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        colSpan="3"
                        style={{
                          border: "1px solid black",
                          padding: "5px",
                        }}
                      >
                        Přehled DPH (v Kč)
                      </th>
                    </tr>
                    <tr>
                      <th style={{ border: "1px solid black", padding: "5px" }}>
                        bez DPH
                      </th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>
                        Výše DPH
                      </th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>
                        Celkem
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid black", padding: "5px" }}>
                        {invoiceData?.price && parseFloat(COMPANY_CURRENCY)
                          ? formatNumber(
                              invoiceData?.currency === "EUR"
                                ? invoiceData?.price *
                                    parseFloat(COMPANY_CURRENCY)
                                : invoiceData?.price
                            )
                          : "N/A"}
                      </td>
                      <td style={{ border: "1px solid black", padding: "5px" }}>
                        {invoiceData?.price && parseFloat(COMPANY_CURRENCY)
                          ? formatNumber(
                              invoiceData?.currency === "EUR"
                                ? invoiceData?.price *
                                    parseFloat(COMPANY_CURRENCY) *
                                    0.21
                                : invoiceData?.price * 0.21
                            )
                          : "N/A"}
                      </td>
                      <td style={{ border: "1px solid black", padding: "5px" }}>
                        {invoiceData?.currency === "CZK" &&
                          formatNumber(
                            totalPrice(invoiceData?.vat, invoiceData?.price)
                          )}
                        {invoiceData?.currency === "EUR" &&
                          formatNumber(
                            (
                              totalPrice(invoiceData?.vat, invoiceData?.price) *
                              parseFloat(COMPANY_CURRENCY)
                            ).toFixed(2)
                          )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Table: Částky v EUR */}
              <div
                style={{
                  border: "1px solid black",
                  width: "25%",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "12px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "center",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        colSpan="1"
                        style={{
                          border: "1px solid black",
                          padding: "5px",
                        }}
                      >
                        {invoiceData?.currency === "EUR" && "Částky v EUR"}
                        {invoiceData?.currency === "CZK" && "Částky v CZK"}
                      </th>
                    </tr>
                    <tr>
                      <th
                        colSpan="1"
                        style={{ border: "1px solid black", padding: "5px" }}
                      >
                        Celkem vč. DPH
                      </th>
                    </tr>
                    <tr>
                      <th
                        colSpan="1"
                        style={{ border: "1px solid black", padding: "5px" }}
                      >
                        {formatNumber(
                          totalPrice(invoiceData?.vat, invoiceData?.price)
                        )}
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
            <br />

            {/* Amount Section */}
            <div
              style={{
                display: "flex",
                justifyContent: "right",
                alignItems: "center",
                marginTop: "20px",
                fontFamily: "Arial, sans-serif",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              {invoiceData?.currency === "EUR" && (
                <strong>Částka k úhradě EUR:</strong>
              )}
              {invoiceData?.currency === "CZK" && (
                <strong>Částka k úhradě CZK:</strong>
              )}
              <div
                style={{
                  fontWeight: "bold",
                  border: "2px solid black",
                  padding: "5px",
                  width: "25%",
                  marginLeft: "20px",
                }}
              >
                {formatNumber(totalPrice(invoiceData?.vat, invoiceData?.price))}
              </div>
            </div>
          </div>

          {/* Final Kurs Table */}
          <div
            style={{
              border: "1px solid black",
              marginTop: "20px",
              width: "40%",
              fontFamily: "Arial, sans-serif",
              fontSize: "12px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "center",
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan="1"
                    style={{ border: "1px solid black", padding: "5px" }}
                  >
                    Kurs {invoiceData?.vat_date?.slice(0, 4)}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan="1"
                    style={{ border: "1px solid black", padding: "5px" }}
                  >
                    {parseFloat(COMPANY_CURRENCY)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Total Price in Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "right",
          flexDirection: "column",
          gap: "5px",
          textAlign: "right",
          marginTop: "20px",
          fontWeight: "bold",
        }}
      >
        <div>
          {invoiceData?.currency === "EUR" && "Součet: EUR "}
          {invoiceData?.currency === "CZK" && "Součet: CZK "}
          {formatNumber(totalPrice(invoiceData?.vat, invoiceData?.price))}
        </div>
        <div>
          {invoiceData?.currency === "EUR" && "TOTAL: EUR "}
          {invoiceData?.currency === "CZK" && "TOTAL: CZK "}
          {formatNumber(totalPrice(invoiceData?.vat, invoiceData?.price))}
        </div>
      </div>
    </div>
  );
};

export default InvoiceComponent;
