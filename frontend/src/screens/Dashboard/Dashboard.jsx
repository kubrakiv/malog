import React from "react";
import "./Dashboard.scss";
import TrialStatusBanner from "../../components/TrialStatusBanner/TrialStatusBanner";
// import DragAndDropComponent from "../../components/DragAndDropComponent/DragAndDropComponent";

const Dashboard = () => {
  return (
    <>
      <div className="dashboard-container">
        <TrialStatusBanner />
        <h1>Dashboard</h1>
      </div>
      {/* <DragAndDropComponent orders={orders} handleOrders={handleOrders} /> */}
    </>
  );
};

export default Dashboard;
