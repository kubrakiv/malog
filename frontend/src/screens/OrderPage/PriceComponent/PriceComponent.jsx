import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { listPaymentTypes } from "../../../actions/paymentTypeActions";
import { listCurrencies } from "../../../features/currencies/currenciesOperations";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { transformSelectOptions } from "../../../utils/transformers";
import { selectCurrencies } from "../../../features/currencies/currenciesSelectors";
import cn from "classnames";

import InputComponent from "../../../globalComponents/InputComponent";
import SelectComponent from "../../../globalComponents/SelectComponent";
import CheckboxComponent from "../../../globalComponents/CheckboxComponent";
import PricePerKmComponent from "../PricePerKmComponent/PricePerKmComponent";
import FormWrapper from "../../../components/FormWrapper";
import ProfitComponent from "../../../components/ProfitComponent";

import { PRICE_CONSTANTS } from "../../../constants/global";
import { formFields } from "./priceFormFields";
import { totalDistance } from "../../../utils/getTotalDistance";
import { formatPrice } from "../../../utils/formatCurrency";

import "./PriceComponent.scss";

function PriceComponent() {
  const dispatch = useDispatch();
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const paymentTypes = useSelector(
    (state) => state.paymentTypesInfo.paymentTypes.data
  );
  const currencies = useSelector(selectCurrencies);

  const paymentTypesOptions = transformSelectOptions(paymentTypes, "name");
  const currenciesOptions = transformSelectOptions(currencies, "short_name");

  const [priceFields, setPriceFields] = useState(
    Object.values(PRICE_CONSTANTS).reduce((acc, item) => {
      acc[item] = item === PRICE_CONSTANTS.VAT ? false : ""; // Default `vat` to false
      return acc;
    }, {})
  );

  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");

  useEffect(() => {
    if (order) {
      const defaultValues = Object.values(PRICE_CONSTANTS).reduce(
        (acc, item) => {
          acc[item] =
            order?.[item] !== undefined
              ? order[item]
              : item === PRICE_CONSTANTS.VAT
              ? false
              : "";
          return acc;
        },
        {}
      );
      setPriceFields(defaultValues);
      setSelectedPaymentType(order.payment_type);
      setSelectedCurrency(order.currency);
    }
  }, [order]);

  useEffect(() => {
    dispatch(listPaymentTypes());
    dispatch(listCurrencies());
  }, [dispatch]);

  const handlePriceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPriceFields((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = () => {
    const dataToUpdate = {
      ...priceFields,
      payment_type: selectedPaymentType,
      currency: selectedCurrency,
    };

    console.log("DataToUpdate", dataToUpdate);

    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
  };

  const getPaymentType = (paymentType) => {
    switch (paymentType) {
      case "by copies":
        return "по копіям";
      case "by originals":
        return "по оригіналам";

      default:
        return "";
    }
  };

  return (
    <>
      <FormWrapper
        title="Тариф"
        content={
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "5px",
              }}
              className="order-details__content-row-block-value"
            >
              {formatPrice(order.price, order.currency)}
              {order.currency === "CZK" &&
                ` (${parseFloat(order.price / 25.185).toFixed(0)} EUR)`}
              {order.vat ? " з ПДВ" : ""}
            </div>
            <div className="order-details__content-row-block-value">
              {order.payment_period} днів {getPaymentType(order.payment_type)}
            </div>
          </>
        }
        secondTitle={
          order.distance ? (
            <div style={{ display: "flex", gap: "5px", flexDirection: "row" }}>
              <ProfitComponent order={order} type={"value-percent"} />
              <PricePerKmComponent
                type={"price"}
                price={order.price}
                distance={totalDistance(order)}
                currency={order.currency}
              />
            </div>
          ) : null
        }
        handleFormSubmit={handleFormSubmit}
      >
        <form>
          <div className="order-details__price-form-container">
            <div className="order-details__form-row">
              {formFields.map((item) => {
                const { component, id, placeholder, type, title, label } = item;

                let options = [];
                let value = "";
                let handleChange;

                switch (id) {
                  case PRICE_CONSTANTS.PAYMENT_TYPE:
                    options = paymentTypesOptions;
                    value = selectedPaymentType || ""; // Bind selectedPaymentType to the dropdown
                    handleChange = (e) =>
                      setSelectedPaymentType(e.target.value); // Update selectedPaymentType
                    break;
                  case PRICE_CONSTANTS.CURRENCY:
                    options = currenciesOptions;
                    value = selectedCurrency || ""; // Bind selectedCurrency to the dropdown
                    handleChange = (e) => setSelectedCurrency(e.target.value); // Update selectedCurrency
                    break;
                  default:
                    value = priceFields[id] || "";
                    handleChange = handlePriceChange; // Use general handler for other fields
                    break;
                }

                return (
                  <div
                    key={id}
                    className={cn("order-details__form-row_item", {
                      "full-width": item.isFullWidth,
                    })}
                  >
                    {component === "select" && (
                      <SelectComponent
                        title={title}
                        id={id}
                        name={id}
                        value={value}
                        onChange={handleChange}
                        options={options}
                      />
                    )}
                    {component === "checkbox" && (
                      <CheckboxComponent
                        id={id}
                        name={id}
                        type={type}
                        label={label}
                        checked={priceFields[id] || false}
                        onChange={(e) => handlePriceChange(e)}
                      />
                    )}
                    {component === "input" && (
                      <InputComponent
                        id={id}
                        name={id}
                        type={type}
                        title={placeholder}
                        placeholder={placeholder}
                        value={priceFields[id]}
                        onChange={(e) => handlePriceChange(e)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </FormWrapper>
    </>
  );
}

export default PriceComponent;
