import { useState } from "react";
import { FaPencilAlt, FaRegTrashAlt } from "react-icons/fa";

import "./style.scss";
import AddCustomerManagerComponent from "../AddCustomerManagerComponent";

const CustomerManagerCardComponent = ({
  customer,
  manager,
  onAddManager,
  onEditManager,
  isEditMode,
  onFinishEdit,
  onDeleteManager,
}) => {
  const [isHovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const onEditMode = (e, manager) => {
    e.preventDefault();
    // Trigger the parent component to set the edit mode
    onEditManager(manager);
  };

  return (
    <>
      <div
        key={manager.email}
        className="customer-manager-card__content-row"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="customer-manager-card__content-row-block">
          <div className="customer-manager-card__content-row-block-value_full-name">
            {manager?.full_name}
          </div>
          <div className="customer-manager-card__content-row-block-value_position">
            {manager?.position}
          </div>
          <div className="customer-manager-card__content-row-block-value">
            &#128386; {manager?.email}
          </div>
          <div className="customer-manager-card__content-row-block-value">
            &#9990; {manager?.phone}
          </div>
          {isHovered && (
            <div className="customer-manager-card__actions">
              <button
                type="button"
                title="Редагувати менеджера"
                className="customer-manager-card__btn customer-manager-card__btn_edit"
                onClick={(e) => onEditMode(e, manager)}
              >
                <FaPencilAlt />
              </button>
              <button
                type="button"
                title="Видалити менеджера"
                className="customer-manager-card__btn customer-manager-card__btn_delete"
                onClick={(e) => onDeleteManager(e, manager)}
              >
                <FaRegTrashAlt />
              </button>
            </div>
          )}
        </div>
      </div>
      {isEditMode && (
        <AddCustomerManagerComponent
          customer={customer}
          onAddManager={onAddManager}
          initialManagerData={manager}
          onFinishEdit={onFinishEdit}
          isEditMode={isEditMode}
        />
      )}
    </>
  );
};

export default CustomerManagerCardComponent;
