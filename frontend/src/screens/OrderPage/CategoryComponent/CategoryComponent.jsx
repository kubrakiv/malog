import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { listRouteCategories } from "../../../features/routeCategories/routeCategoriesOperations";
import { selectRouteCategories } from "../../../features/routeCategories/routeCategoriesSelectors";
import { transformSelectOptions } from "../../../utils/transformers";

import FormWrapper from "../../../components/FormWrapper";
import SelectComponent from "../../../globalComponents/SelectComponent";

const CategoryComponent = () => {
  const dispatch = useDispatch();

  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const categories = useSelector(selectRouteCategories);

  const [selectedCategory, setSelectedCategory] = useState(order.category || "");

  useEffect(() => {
    dispatch(listRouteCategories());
  }, [dispatch]);

  useEffect(() => {
    setSelectedCategory(order.category || "");
  }, [order.category]);

  const categoryOptions = useMemo(
    () => transformSelectOptions(categories, "ukr", "id"),
    [categories]
  );

  const handleFormSubmit = () => {
    const dataToUpdate = {
      category: selectedCategory || null,
    };
    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
  };

  return (
    <>
      <FormWrapper
        title="Категорія"
        content={
          <div className="order-details__content-row-block-value">
            {order.category_info?.ukr || "—"}
          </div>
        }
        handleFormSubmit={handleFormSubmit}
      >
        <form>
          <SelectComponent
            title="Виберіть категорію"
            id="category"
            name="category"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categoryOptions}
          />
        </form>
      </FormWrapper>
    </>
  );
};

export default CategoryComponent;
