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
import CategoryComponent from "./CategoryComponent/CategoryComponent";
import CarrierManagerComponent from "./CarrierManagerComponent/CarrierManagerComponent";
import FooterComponent from "./FooterComponent/FooterComponent";
import AddTaskModalComponent from "../../components/AddTask/AddTaskModalComponent/AddTaskModalComponent";
import MarketPriceComponent from "./MarketPriceComponent/MarketPriceComponent";
import OrderHereMapComponent from "./OrderHereMapComponent";
import UploadDocumentsComponent from "../../components/UploadDocumentsComponent/UploadDocumentsComponent";
import TruckLocationComponent from "./TruckLocationComponent";
import AssignTruckAndDriverCompoonent from "./AssignTruckAndDriverComponent";
import OrderNoticeComponent from "./OrderNoticeComponent/OrderNoticeComponent";
import { FaMapMarkedAlt, FaTimes } from "react-icons/fa";

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
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [hasOpenedMapDrawer, setHasOpenedMapDrawer] = useState(false);

  const order = useSelector((state) => state.ordersInfo.orderDetails.data);

  useEffect(() => {
    if (id) {
      dispatch(listOrderDetails(id)).then((action) => {
        const orderId = action.payload?.id;
        if (orderId) {
          dispatch(listDocuments(orderId));
        }
      });
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

  const openMapDrawer = () => {
    setHasOpenedMapDrawer(true);
    setIsMapDrawerOpen(true);
  };

  return (
    <>
      <AddTaskModalComponent />
      <UploadDocumentsComponent />
      <div className="order-container">
        <div className="order-details">
          <HeaderComponent />
          <ActionsComponent onOpenMap={openMapDrawer} />
          <div className="order-details__content">
            <div className="order-details__content-block">
              <div className="order-details__content-row">
                <CategoryComponent />
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
            </div>
          </div>
          <FooterComponent />
        </div>
      </div>
      <div
        className={`order-map-drawer${
          isMapDrawerOpen ? " order-map-drawer_open" : ""
        }`}
        aria-hidden={!isMapDrawerOpen}
      >
        <div className="order-map-drawer__header">
          <div className="order-map-drawer__title">
            <FaMapMarkedAlt />
            <span>Карта маршруту</span>
          </div>
          <button
            type="button"
            className="order-map-drawer__close"
            onClick={() => setIsMapDrawerOpen(false)}
            aria-label="Закрити карту"
            title="Закрити карту"
          >
            <FaTimes />
          </button>
        </div>
        <div className="order-map-drawer__body">
          {hasOpenedMapDrawer && <OrderHereMapComponent enableFactual readOnly />}
        </div>
      </div>
      {isMapDrawerOpen && (
        <button
          type="button"
          className="order-map-drawer__backdrop"
          onClick={() => setIsMapDrawerOpen(false)}
          aria-label="Закрити карту"
        />
      )}
    </>
  );
};

export default OrderPage;
