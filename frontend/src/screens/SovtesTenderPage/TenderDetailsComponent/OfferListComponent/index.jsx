import React from "react";
import "./style.scss";

const OfferListComponent = ({ tender }) => {
  console.log("tender", tender);
  // Convert responses object to an array
  const myOffers = Object.values(tender.response).filter((offer) => offer);
  console.log("myOffers", myOffers);

  // Sort offers by moment date (assuming it's a valid datetime string)
  myOffers.sort((b, a) => new Date(a.moment) - new Date(b.moment));

  return (
    <div className="offer-list-container">
      {myOffers.length === 0 && (
        <div className="offer-item-details">
          <span>Немає пропозицій.</span>
        </div>
      )}
      {myOffers.length > 0 && (
        <>
          <strong>Пропозиції за ціною</strong>
          <div className="offer-item-details">
            {myOffers.map((offer, index) => (
              <div key={offer.id} className="offer-item-details">
                <div className="offer-price">
                  <strong>{offer.pricequotewithcommission}</strong>{" "}
                  <span>{offer.loadquote} перевезень</span>
                </div>
                <div className="offer-date">
                  Залишено {new Date(offer.moment).toLocaleString("uk-UA")}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OfferListComponent;
