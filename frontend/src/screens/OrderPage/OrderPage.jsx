import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { listOrderDetails } from "../../features/orders/ordersOperations";

import TruckComponent from "./TruckComponent/TruckComponent";
import DriverComponent from "./DriverComponent/DriverComponent";
import PriceComponent from "./PriceComponent/PriceComponent";
import CustomerComponent from "./CustomerComponent/CustomerComponent";
import CargoComponent from "./CargoComponent/CargoComponent";
import CustomerManagerComponent from "./CustomerManagerComponent/CustomerManagerComponent";
import TaskComponent from "./TaskComponent/TaskComponent";
import RouteComponent from "./RouteComponent/RouteComponent";
import HeaderComponent from "./HeaderComponent/HeaderComponent";
import ActionsComponent from "./ActionsComponent/ActionsComponent";
import CarrierComponent from "./CarrierComponent/CarrierComponent";
import CarrierManagerComponent from "./CarrierManagerComponent/CarrierManagerComponent";
import FooterComponent from "./FooterComponent/FooterComponent";
import AddTaskModalComponent from "../../components/AddTask/AddTaskModalComponent/AddTaskModalComponent";
import MarketPriceComponent from "./MarketPriceComponent/MarketPriceComponent";
import OrderMapComponent from "./OrderMapComponent";
import OrderHereMapComponent from "./OrderHereMapComponent";
import UploadDocumentsComponent from "../../components/UploadDocumentsComponent/UploadDocumentsComponent";
import TruckLocationComponent from "./TruckLocationComponent";
import AssignTruckAndDriverCompoonent from "./AssignTruckAndDriverComponent";
import OrderNoticeComponent from "./OrderNoticeComponent/OrderNoticeComponent";

import { listDocuments } from "../../actions/documentActions";

import "./OrderPage.scss";

import {
  resetOrderDetails,
  setOrderFactData,
} from "../../features/orders/ordersSlicers";
import { resetDocumentListData } from "../../reducers/documentReducers";
import {
  setTruckToNextTask,
  setTruckCurrentLocation,
} from "../../actions/mapActions";

const OrderPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const order = useSelector((state) => state.ordersInfo.orderDetails.data);

  useEffect(() => {
    if (id) {
      dispatch(listOrderDetails(id));
      dispatch(listDocuments(id));
    }
  }, [id]);

  useEffect(
    () => () => {
      // Cleanup function to reset the order details when the component unmounts
      dispatch(resetOrderDetails());
      dispatch(resetDocumentListData()); // Reset document list data in Redux store
      dispatch(setTruckToNextTask({}));
      dispatch(setTruckCurrentLocation(null));
      dispatch(setOrderFactData({}));
    },
    []
  );

  if (!order || !order.id) {
    return <div>Loading...</div>; // or a spinner
  }

  return (
    <>
      <AddTaskModalComponent />
      <UploadDocumentsComponent />
      <div className="order-container">
        <div className="order-details">
          <HeaderComponent />
          <ActionsComponent />
          <div className="order-details__content">
            <div className="order-details__content-block">
              <div className="order-details__content-row">
                <CarrierComponent />
                <CarrierManagerComponent />
              </div>
              <div className="order-details__content-row">
                {order.truck && order.driver ? (
                  <>
                    <TruckComponent />
                    <DriverComponent />
                  </>
                ) : (
                  <AssignTruckAndDriverCompoonent />
                )}
              </div>
              <div className="order-details__content-row">
                <div className="order-details__content-row-block order-details__content-row-block_tasks">
                  <RouteComponent />

                  <TaskComponent />
                </div>
              </div>
            </div>
            <div className="order-details__content-block">
              <div className="order-details__content-row">
                <PriceComponent />
                <MarketPriceComponent />
                <CustomerComponent />
              </div>
              <div className="order-details__content-row">
                <CargoComponent />
                <CustomerManagerComponent />
              </div>
              <div className="order-details__content-row">
                <OrderNoticeComponent />
              </div>
              <div className="order-details__content-row">
                <TruckLocationComponent />
              </div>
              {/* <OrderMapComponent /> */}
              <div className="order-details__content-row">
                <OrderHereMapComponent enableFactual readOnly />
              </div>
            </div>
          </div>
          <FooterComponent />
        </div>
      </div>
    </>
  );
};

export default OrderPage;
