import "./style.scss"; // Add styles for your status badge
import { transformDate } from "../../../utils/formatDate";

const InvoiceStatusComponent = ({ order }) => {
  const getStatus = () => {
    const { invoice } = order;
    if (invoice) {
      if (invoice.payment_date) {
        return {
          status: `Paid ${transformDate(invoice.payment_date)}`,
          color: "green",
        };
      }
      if (invoice.due_date) {
        const currentDate = new Date();
        const dueDate = new Date(invoice.due_date);
        const differenceInDays = Math.ceil(
          (dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (differenceInDays < 0) {
          return {
            status: `-${Math.abs(differenceInDays)} days`,
            color: "red",
          };
        } else if (differenceInDays === 0) {
          return {
            status: "Due Today",
            color: "orange",
          };
        } else {
          return {
            status: `${differenceInDays} days`,
            color: "blue",
          };
        }
      }
    }
    return { status: "No Invoice", color: "gray" };
  };

  const { status, color } = getStatus();

  return <span className={`status-badge ${color}`}>{status}</span>;
};

export default InvoiceStatusComponent;
