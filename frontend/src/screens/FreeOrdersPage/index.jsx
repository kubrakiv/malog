import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getFreeOrders } from "../../features/orderImport/orderImportOperations";
import { parseTenders } from "../../utils/getTenderDetails";
import { createRoute } from "../../features/orderImport/orderImportOperations";
import toast from "react-hot-toast";

import "./style.scss";

const SovtesTenderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [parsedFreeOrders, setParsedFreeOrders] = useState([]);

  const freeOrders = useSelector((state) => state.sovtesInfo.freeOrders);
  console.log("freeOrders", freeOrders);
  const { loading, error } = freeOrders;

  useEffect(() => {
    dispatch(getFreeOrders());
  }, [dispatch]);

  useEffect(() => {
    if (freeOrders?.data?.length > 0) {
      setParsedFreeOrders(parseTenders(freeOrders.data));
    }
  }, [freeOrders]);

  const getFreeOrder = (id) => {
    return freeOrders.data.find((order) => order.id === id);
  };

  const handleCreateOrder = (orderData, platform) => {
    const order = getFreeOrder(orderData.id);
    const data = { order: order.details, platform: platform };
    console.log("Creating order with data:", data);

    dispatch(createRoute(data))
      .unwrap() // Wait for the async thunk to resolve or reject
      .then((response) => {
        // Success toast
        toast.success(response.message || "Order created successfully!");

        navigate("/orders");
      })
      .catch((error) => {
        // Log or handle specific error messages returned by the backend
        if (error.error) {
          toast.error(`Error: ${error.error}`);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      });
  };

  return (
    <div className="tenders-container">
      <div className="orders-header-block">
        <h2 className="table__name">
          Вільні замовлення ({parsedFreeOrders.length})
        </h2>
      </div>

      {/* Show loading spinner until tenders are fetched */}
      {loading ? (
        <div className="loading-container">
          <p>Завантаження ...</p>
        </div>
      ) : (
        <div className="tenders-list">
          {parsedFreeOrders.length > 0 ? (
            parsedFreeOrders.map((tender) => (
              <>
                <div
                  key={tender.id}
                  // className={`offer-item ${
                  //   expandedTender === tender.id ? "expanded" : ""
                  // }`}
                  className="free-order-item"
                >
                  {/* First Row: Customer */}
                  <div
                    className="tender-customer"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {tender.payor} <span>{tender.periodic}</span>
                  </div>
                  {/* Second Row: All Other Blocks */}
                  <div className="offer-details">
                    {/* Block 1: Origin */}
                    <div className="offer-block origin">
                      <span
                        className={`fi fi-${tender.origin.country.toLowerCase()}`}
                      ></span>
                      <strong className="place-code">
                        {`${tender.origin.country} -${tender.origin.postal} ${tender.origin.city}`}
                      </strong>
                      <div className="time">{`${tender.pickup} – ${tender.delivery}`}</div>
                    </div>

                    {/* Block 2: Arrow */}
                    <div className="offer-block arrow">→</div>

                    {/* Block 3: Destination */}
                    <div className="offer-block destination">
                      <span
                        className={`fi fi-${tender.destination.country.toLowerCase()}`}
                      ></span>
                      <strong className="place-code">
                        {`${tender.destination.country} -${tender.destination.postal} ${tender.destination.city}`}
                      </strong>
                      <div className="time">{`${tender.returnPickup} – ${tender.returnDelivery}`}</div>
                    </div>

                    {/* Block 4: Distance */}
                    <div className="offer-block distance">
                      <span className="icon-wg-street"></span>
                      <strong>{tender.distance} km</strong>
                    </div>

                    {/* Block 5: Type */}
                    <div className="offer-block type">
                      <span className="icon-wg-trailer-height"></span>
                      <strong>{tender.type}</strong>
                    </div>

                    {/* Block 6: Weight */}
                    <div className="offer-block weight">
                      <span className="icon-wg-weight"></span>
                      <strong>{tender.weight}</strong>
                    </div>

                    {/* Block 7: Price */}
                    <div className="offer-block price">
                      <strong>
                        {tender.price} {tender.currency.toUpperCase()}
                      </strong>
                    </div>
                    {/* Block 8: Create Order Button */}
                    <div className="offer-block create-order">
                      <button
                        className="create-order-button"
                        onClick={() => handleCreateOrder(tender, "sovtes")}
                      >
                        Додати
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ))
          ) : (
            <p className="no-tenders">Немає вільних замовлень</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SovtesTenderPage;
