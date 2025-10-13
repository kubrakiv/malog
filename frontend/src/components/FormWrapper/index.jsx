import { useState } from "react";
import FormButtonComponent from "../../screens/OrderPage/FormButtonComponent/FormButtonComponent";
import { useSelector } from "react-redux";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

const FormWrapper = ({
  disableEditMode,
  children,
  title,
  content,
  handleFormSubmit,
  hiddenContent = null,
  secondTitle = null,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [isShowHiddenContent, setIsShowHiddenContent] = useState(false);

  const editModeOrder = useSelector((state) => state.ordersInfo.editModeOrder);

  const arrowBlock = isShowHiddenContent ? <FaAngleUp /> : <FaAngleDown />;

  return (
    <>
      <div
        style={{ userSelect: "none" }}
        className="order-details__content-row-block"
        onDoubleClick={
          disableEditMode ? null : () => setEditMode((prev) => !prev)
        }
      >
        <div className="order-details__content-row-block_price">
          <div
            className="order-details__content-row-block-title"
            onClick={
              hiddenContent
                ? () => setIsShowHiddenContent((prev) => !prev)
                : null
            }
          >
            {title}
            {hiddenContent ? arrowBlock : null}
          </div>
          {secondTitle && (
            <div className="order-details__content-row-block-title">
              {secondTitle}
            </div>
          )}
        </div>
        {editMode || editModeOrder ? (
          <>
            {children}
            <FormButtonComponent
              onSave={handleFormSubmit}
              onClose={setEditMode}
              setEditMode={setEditMode}
            />
          </>
        ) : (
          content
        )}
        {isShowHiddenContent && !editMode && hiddenContent}
      </div>
    </>
  );
};

export default FormWrapper;
