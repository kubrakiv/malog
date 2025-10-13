import React from "react";
import { useSelector } from "react-redux";

const UploadDocumentsHeaderComponent = () => {
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);

  return (
    <>
      <div className="upload-documents__header">
        <div className="upload-documents__header-block">
          Документи до маршруту {order.number}
        </div>
      </div>
    </>
  );
};

export default UploadDocumentsHeaderComponent;
