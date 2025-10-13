import "./style.scss"; // Styles for the status badge

const OrderStatusComponent = ({ order }) => {
  const getOrderStatus = () => {
    const unloadingTask = order.tasks.find(
      (task) => task.type.toLowerCase() === "unloading"
    );

    if (unloadingTask) {
      if (!unloadingTask.end_date || !unloadingTask.end_time) {
        return { status: "In progress", color: "blue" };
      }
      return { status: "Completed", color: "green" };
    }

    return { status: "No Unloading Task", color: "gray" };
  };

  const { status, color } = getOrderStatus();

  return <span className={`order-status ${color}`}>{status}</span>;
};

export default OrderStatusComponent;
