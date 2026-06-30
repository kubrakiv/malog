import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useConfirm } from "../../globalComponents/ConfirmModal/useConfirm";
import toast from "react-hot-toast";

import { sendEmail } from "../../features/emails/emailsOperations";
import { updateOrderStatus } from "../../features/orderStatuses/orderStatusesOperations";

import { extractRoute } from "../../utils/getRoute";
import { transformDate } from "../../utils/formatDate";
import { getEmailsFromOrder } from "../../utils/getEmailsFromOrder";
import { getCmrNumber } from "../../utils/getCmrNumber";
import { getPostAddressFromOrder } from "../../utils/getPostAddress";

import { FaEnvelope, FaEnvelopeOpenText } from "react-icons/fa";

import { DELIVERY_CONSTANTS, ORDER_STATUSES } from "../../constants/global";
const { LOADING, UNLOADING } = DELIVERY_CONSTANTS;
const { DOCUMENTS_SENT } = ORDER_STATUSES;
import { OFFICE_EMAILS } from "../../constants/global";
const { OFFICE_EMAIL, OFFICE_MANAGER_EMAIL, OFFICE_DIRECTOR_EMAIL } =
  OFFICE_EMAILS;

const EmailSenderComponent = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const documents = useSelector(
    (state) => state.documentsInfo.documents.data.documents
  );
  const invoiceData = useSelector(
    (state) => state.invoicesInfo.invoiceDetails.data
  );
  const customers = useSelector((state) => state.customersInfo.customers.data);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // const isOrderFinished = order.tasks?.every(
  //   (task) =>
  //     (task.type === LOADING || task.type === UNLOADING) &&
  //     task.end_date &&
  //     task.end_time
  // );
  const isOrderFinished = order.tasks
    ?.filter((task) => task.type === LOADING || task.type === UNLOADING)
    .every((task) => task.end_date && task.end_time);

  console.log("isOrderFinished:", isOrderFinished);

  const handleSendEmail = async () => {
    console.log("Sending email...");
    const confirmSending = await confirm(
      "Ви впевнені що хочете відправити Email?"
    );
    if (!confirmSending) {
      console.log("Email sending cancelled.");
      return; // Exit if the user cancels
    }

    setIsSending(true);
    try {
      // Extracting necessary information
      const customerEmail = getEmailsFromOrder(order, customers);
      const documentFiles = documents.map((doc) => doc.file);

      const officeEmails = [
        OFFICE_EMAIL,
        OFFICE_MANAGER_EMAIL,
        OFFICE_DIRECTOR_EMAIL,
      ];

      // Prepare data to be sent to the backend
      const emailData = {
        order_number: order.order_number,
        customer: order.customer,
        customer_manager: order.customer_manager,
        customer_email:
          order.payment_type === "by copies" ? customerEmail : officeEmails,
        price: order.price,
        currency: order.currency,
        documents: documentFiles,
        route: extractRoute(order),
        payment_type: order.payment_type,
        invoice_number: invoiceData?.number,
        invoice_date: transformDate(invoiceData?.invoicing_date),
        post_address: getPostAddressFromOrder(order, customers),
        cmr_number: getCmrNumber(documents),
      };
      console.log("Email data:", emailData);

      if (!isOrderFinished) {
        toast.error("Order is not finished yet.", {
          position: "top-right",
          style: { color: "black", marginTop: "0rem" },
        });
        setMessage("Order is not finished yet.");
        setIsSending(false);
        return;
      }

      // Dispatch sendEmail and ensure it succeeds
      const emailResult = await dispatch(sendEmail(emailData)).unwrap();
      console.log("Email result:", emailResult);

      toast.success("Email sent successfully.", {
        position: "top-right",
        style: { color: "black", marginTop: "0rem" },
      });

      // Update order status after successful email dispatch
      try {
        const orderStatusData = {
          status_id: ORDER_STATUSES.DOCUMENTS_SENT.id,
        };
        await dispatch(
          updateOrderStatus({ orderId: order.id, orderStatusData })
        ).unwrap(); // Unwrap to handle success/failure
        toast.success("Order status updated to 'Documents Sent'.", {
          position: "top-right",
          style: { color: "black", marginTop: "0rem" },
        });
      } catch (statusError) {
        console.error("Failed to update order status:", statusError);
        toast.error("Failed to update order status.", {
          position: "top-right",
          style: { color: "black", marginTop: "0rem" },
        });
      }

      setMessage("Email sent successfully.");
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email.", {
        position: "top-right",
        style: { color: "black", marginTop: "0rem" },
      });
      setMessage("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleSendEmail}
      disabled={isSending}
      className="order-details__action-send-documents-btn"
      data-tooltip="Відправити Email"
    >
      {isSending ? <FaEnvelopeOpenText /> : <FaEnvelope />}
    </button>
  );
};

export default EmailSenderComponent;
