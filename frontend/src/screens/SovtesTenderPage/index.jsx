import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./style.scss";

import TenderDetailsComponent from "./TenderDetailsComponent";

import { listCurrentTenders } from "../../features/sovtesTenders/sovtesTendersOperations";
import { parseTenders } from "../../utils/getTenderDetails";

const SovtesTenderPage = () => {
  const [parsedTenders, setParsedTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTender, setExpandedTender] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(listCurrentTenders());
  }, [dispatch]);

  const tendersData = useSelector(
    (state) => state.sovtesTendersInfo.currentTenders
  );

  useEffect(() => {
    if (tendersData?.data?.length > 0) {
      setParsedTenders(parseTenders(tendersData.data));
      setLoading(false);
    }
  }, [tendersData]);

  const toggleTenderDetails = (tenderId) => {
    setExpandedTender(expandedTender === tenderId ? null : tenderId);
  };

  const getMyOffer = (tender) => {
    if (!tender.response) return null;

    // Convert object values to an array
    const responses = Object.values(tender.response);

    // Filter responses where isMine is true
    const myOffers = responses.filter((response) => response.isMine);

    if (myOffers.length === 0) return null;

    // Sort responses by moment (assuming it is a datetime string)
    myOffers.sort((a, b) => new Date(a.moment) - new Date(b.moment));

    // Get the last object
    const lastOffer = myOffers[myOffers.length - 1];

    return Math.round(lastOffer?.pricequotewithcommission) || null;
  };

  const getMinimPriceOffer = (tender) => {
    if (!tender.response) return null;

    // Convert object values to an array
    const responses = Object.values(tender.response);

    // Filter responses where isMine is true
    const myOffers = responses.filter((response) => response);

    if (myOffers.length === 0) return null;

    // Sort responses by moment (assuming it is a datetime string)
    myOffers.sort((a, b) => new Date(a.moment) - new Date(b.moment));

    // Get the last object
    const lastOffer = myOffers[myOffers.length - 1];

    return Math.round(lastOffer?.pricequotewithcommission) || null;
  };

  const getPricePerKm = (tender, price) => {
    if (!tender.distance || !price) return null;

    const pricePerKm = parseFloat(price) / parseFloat(tender.distance);

    // return `${pricePerKm.toFixed(2)} ${tender.currency.toUpperCase()}/км`;
    return `(${pricePerKm.toFixed(2)})`;
  };

  return (
    <div className="tenders-container">
      <div className="orders-header-block">
        <h2 className="table__name">
          Поточні тендери ({parsedTenders.length})
        </h2>
      </div>

      {/* Show loading spinner until tenders are fetched */}
      {loading ? (
        <div className="loading-container">
          <p>Завантаження тендерів...</p>
        </div>
      ) : (
        <div className="tenders-list">
          {parsedTenders.length > 0 ? (
            parsedTenders.map((tender) => (
              <>
                <div
                  key={tender.id}
                  className={`offer-item ${
                    expandedTender === tender.id ? "expanded" : ""
                  }`}
                  onClick={() => toggleTenderDetails(tender.id)}
                >
                  {/* First Row: Customer */}
                  <div className="tender-customer">
                    <span>{tender.payor}</span>
                    {Object.values(tender.response).length === 0 ? (
                      <span></span> /* Empty span to maintain alignment */
                    ) : (
                      <span>
                        Пропозиції: {Object.values(tender.response).length}
                      </span>
                    )}
                    <span>{tender.periodic}</span>
                  </div>
                  {/* Second Row: All Other Blocks */}
                  <div className="offer-details">
                    {/* Block 1: Origin */}
                    <div className="offer-block origin">
                      <span
                        className={`fi fi-${tender.origin.country.toLowerCase()}`}
                      ></span>
                      <strong className="place-code">
                        {`${tender.origin.country} ${tender.origin.city}`}
                      </strong>
                      <div className="time">{`${tender.pickup}`}</div>
                    </div>

                    {/* Block 2: Arrow */}
                    <div className="offer-block arrow">→</div>

                    {/* Block 3: Destination */}
                    <div className="offer-block destination">
                      <span
                        className={`fi fi-${tender.destination.country.toLowerCase()}`}
                      ></span>
                      <strong className="place-code">
                        {`${tender.destination.country} ${tender.destination.city}`}
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
                      <strong>
                        {Math.round(parseFloat(tender.weight), 2)}
                      </strong>
                    </div>

                    {/* Block 7: Price */}

                    <div className="price">
                      <table className="price-table">
                        <tbody>
                          <tr className="price-row">
                            <td className="label start-price">Стартова:</td>
                            <td className="value start-price">
                              {tender.price} {tender.currency.toUpperCase()}{" "}
                              {getPricePerKm(tender, tender.price)}
                            </td>
                          </tr>
                          {getMyOffer(tender) && (
                            <tr className="price-row">
                              <td className="label my-price">Моя:</td>
                              <td className="value my-price">
                                {getMyOffer(tender)}{" "}
                                {tender.currency.toUpperCase()}{" "}
                                {getPricePerKm(tender, getMyOffer(tender))}
                              </td>
                            </tr>
                          )}
                          {getMinimPriceOffer(tender) && (
                            <tr className="price-row">
                              <td className="label min-price">Мінімальна:</td>
                              <td className="value min-price">
                                {getMinimPriceOffer(tender)}{" "}
                                {tender.currency.toUpperCase()}{" "}
                                {getPricePerKm(
                                  tender,
                                  getMinimPriceOffer(tender)
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Show Tender Details Only If This Tender is Clicked */}
                {expandedTender === tender.id && (
                  <TenderDetailsComponent
                    tender={tender}
                    expandedTender={expandedTender}
                  />
                )}
              </>
            ))
          ) : (
            <p className="no-tenders">Немає доступних тендерів</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SovtesTenderPage;
