import { useState } from "react";
import { useDispatch } from "react-redux";
import { useConfirm } from "../../../globalComponents/ConfirmModal/useConfirm";

import { listCurrentTenders } from "../../../features/sovtesTenders/sovtesTendersOperations";

import OfferListComponent from "./OfferListComponent";

import "./style.scss";

const TenderDetailsCompnent = ({ tender, expandedTender }) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [selectedPrice, setSelectedPrice] = useState(tender.price || "");
  const [quantity, setQuantity] = useState(1);
  const [remark, setRemark] = useState("");

  // Generate the price list based on tender.price and tender.quoteStep
  const getPriceOptions = () => {
    const options = [];
    const startPrice = tender.price || 0;
    const step = tender.quoteStep || 100; // Default step if missing
    for (let i = 0; i < 10; i++) {
      options.push(startPrice - step * i);
    }
    return options;
  };

  const handleSubmitOffer = async () => {
    if (!await confirm("Ви впевнені, що хочете відправити пропозицію?")) {
      return;
    }

    if (!selectedPrice || quantity < 1) {
      alert("Будь ласка, виберіть ціну та введіть кількість!");
      return;
    }

    const payload = {
      route: tender.periodic,
      pricequote: selectedPrice,
      loadquote: quantity,
    };

    console.log("Submitting offer:", payload);

    try {
      const response = await fetch("/api/sovtes/offer-price/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Пропозиція відправлена успішно!");
        // TODO: Send a request to fetch the updated tender list
        dispatch(listCurrentTenders());
      } else {
        alert(`Помилка: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting offer:", error);
      alert("Не вдалося відправити пропозицію. Спробуйте ще раз.");
    }
  };

  const getFullRoute = (routeParts) => {
    if (!routeParts || routeParts.length === 0) return "";

    // Separate loading and unloading points
    const loadingPoints = [];
    const unloadingPoints = [];

    routeParts.forEach((part) => {
      const town = part.checkpoint?.town;
      const country = town?.country?.domainname;
      const city = town?.title_ru;

      if (country && city) {
        const location = `${country} ${city}`;

        // Identify if it's a loading or unloading action
        if (part.workaction_data.title === "charge") {
          loadingPoints.push(location);
        } else if (part.workaction_data.title === "uncharge") {
          unloadingPoints.push(location);
        }
      }
    });

    // Format the full route
    const loadingStr = loadingPoints.join(" - ");
    const unloadingStr = unloadingPoints.join(" - ");

    return `${loadingStr} → ${unloadingStr}`;
  };

  return (
    <div className={`offer-details-actions`}>
      <div
        className="offer-details-actions__header"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <strong>Деталі тендеру:</strong>

        <span> Дійсний до: {tender.expirationDate}</span>
      </div>
      <div className="offer-details-actions__header offer-details-actions__route">
        Повний маршрут: {getFullRoute(tender.routeParts)}
      </div>
      {/* Tender Details */}
      <div className="tender-wrapper">
        <div className="offer-details-actions__details">
          <div className="offer-details-actions__payment-type">
            <strong>Кількість перевезень:</strong> {tender.amount || ""}
          </div>
          <div className="offer-details-actions__route-status">
            <strong>Крок:</strong> {tender.quoteStep || ""}
          </div>
          <div className="offer-details-actions__payment-type">
            <strong>Спосіб оплати:</strong> {tender.paymentType.title || ""}
          </div>
          <div className="offer-details-actions__company">
            <strong>Примітки: </strong> {tender.terms || "Немає приміток"}
          </div>
        </div>

        <OfferListComponent tender={tender} />

        {/* Quoting Section */}
        <div className="offer-details-actions__quote-form">
          <label>
            <strong>Ставка за 1 рейс *</strong>
          </label>
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(Number(e.target.value))}
          >
            {getPriceOptions().map((price, index) => (
              <option key={index} value={price}>
                {price} {tender.currency.toUpperCase()}
              </option>
            ))}
          </select>

          <label>
            <strong>Готовий перевезти *</strong>
          </label>
          <input
            type="number"
            value={quantity}
            min="1"
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          <label>
            <strong>Примітка</strong>
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Додайте коментар..."
          ></textarea>

          <button className="quote-button" onClick={handleSubmitOffer}>
            Відправити пропозицію
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenderDetailsCompnent;
