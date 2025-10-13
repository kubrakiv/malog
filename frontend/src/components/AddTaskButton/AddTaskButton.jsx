import { FaPlus } from "react-icons/fa";
import cn from "classnames";

import "./AddTaskButton.scss";

function AddTaskButton({ onTruckDateSelect, dayNumber, truckId, style }) {
  return (
    <>
      <button
        title="Додати завдання"
        type="button"
        className={cn("plus-btn", {
          "plus-btn__week": style,
        })}
        onClick={() =>
          onTruckDateSelect({
            dayNumber,
            truckId,
          })
        }
      >
        <FaPlus />
      </button>
    </>
  );
}

export default AddTaskButton;
