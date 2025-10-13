import React from "react";
import cn from "classnames";

const TabSwitcher = ({ activeTab, handleToggleMode }) => {
  return (
    <>
      <div className="add-task-modal__header">
        <div
          className={cn(
            "add-task-modal__header-btn add-task-modal__header-btn-left",
            {
              "add-task-modal__header-btn_active": activeTab,
            }
          )}
          onClick={handleToggleMode}
        >
          Вибрати пункт
        </div>
        <div
          className={cn(
            "add-task-modal__header-btn add-task-modal__header-btn-right",
            {
              "add-task-modal__header-btn_active": !activeTab,
            }
          )}
          onClick={handleToggleMode}
        >
          Додати пункт
        </div>
      </div>
    </>
  );
};

export default TabSwitcher;
