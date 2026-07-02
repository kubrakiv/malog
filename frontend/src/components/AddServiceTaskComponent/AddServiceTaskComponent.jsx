import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { transformSelectOptions } from "../../utils/transformers";
import cn from "classnames";

import { createTask, updateTask } from "../../features/tasks/tasksOperations";
import {
  setEditModeServiceTask,
  setShowServiceTaskModal,
} from "../../features/planner/plannerSlice";
import {
  selectEditModeServiceTask,
  selectSelectedTruck,
  selectSelectedDate,
  selectSelectedDriver,
} from "../../features/planner/plannerSelectors";

import AddServiceTaskFooterComponent from "./AddServiceTaskFooterComponent/AddServiceTaskFooterComponent";
import SelectComponent from "../../globalComponents/SelectComponent";
import InputComponent from "../../globalComponents/InputComponent";

import { TASK_CONSTANTS } from "../../constants/global";

import "./AddServiceTaskComponent.scss";

import { selectTrucks } from "../../features/trucks/trucksSelectors";
import { formatDateForInput } from "../../utils/formatDate";
import { formFields } from "./taskFormFields";

const SERVICE_TASK_EXCLUDED_TYPES = new Set(["Loading", "Unloading"]);

const TaskTypeSelect = ({ id, label, title, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleOptionSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="service-task-select" ref={selectRef}>
      {label && (
        <label className="service-task-select__label" htmlFor={id}>
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        className={`service-task-select__control ${
          isOpen ? "service-task-select__control--open" : ""
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={`service-task-select__value ${
            !selectedOption ? "service-task-select__value--placeholder" : ""
          }`}
        >
          {selectedOption?.label || title}
        </span>
        <span className="service-task-select__chevron" />
      </button>
      {isOpen && (
        <div className="service-task-select__menu" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`service-task-select__option ${
                option.value === value
                  ? "service-task-select__option--active"
                  : ""
              }`}
              onClick={() => handleOptionSelect(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AddServiceTaskComponent = ({ onCloseModal, initialTaskData = null }) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(selectSelectedDate);
  const selectedTruck = useSelector(selectSelectedTruck);
  const selectedDriver = useSelector(selectSelectedDriver);

  const trucks = useSelector(selectTrucks);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const taskTypes = useSelector((state) => state.taskTypesInfo.taskTypes.data);

  const trucksOptions = transformSelectOptions(trucks, "plates");
  const driversOptions = transformSelectOptions(drivers, "full_name");
  const taskTypeUkFallbackMap = {
    Loading: "Завантаження",
    Unloading: "Розвантаження",
    Service: "Сервіс",
    Driving: "Дорога",
    Reserve: "Резерв",
    Weekend: "Вихідні",
    Start: "Старт",
    Waiting: "Очікування",
    "Extra Task": "Додаткове завдання",
    Penalty: "Штраф",
    "Sick Leave": "Лікарняний",
    Vacation: "Відпустка",
    "No driver": "Без водія",
  };
  const taskTypesOptions = useMemo(
    () =>
      taskTypes
        .filter((taskType) => !SERVICE_TASK_EXCLUDED_TYPES.has(taskType.name))
        .map((taskType) => ({
          value: taskType.name,
          label:
            taskType.name_uk ||
            taskTypeUkFallbackMap[taskType.name] ||
            taskType.name,
        })),
    [taskTypes],
  );

  // Function to initialize task fields
  const initializeTaskFields = () => {
    const fields = Object.values(TASK_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {});

    // Incorporate selectedDate, selectedTruck, and selectedDriver if available
    if (!initialTaskData) {
      if (selectedDate) {
        fields[TASK_CONSTANTS.TASK_START_DATE] = selectedDate[1] ?? "";
      }
      if (selectedTruck) {
        fields[TASK_CONSTANTS.TASK_TRUCK] = selectedTruck.plates;
      }
      if (selectedDriver) {
        fields[TASK_CONSTANTS.TASK_DRIVER] = selectedDriver.full_name;
      }
    } else {
      // If there's initial task data (edit mode), use that as initial values
      Object.assign(fields, initialTaskData);
    }

    return fields;
  };

  // State to manage task fields
  const [taskFields, setTaskFields] = useState(initializeTaskFields());

  // Effect to reset task fields when initialTaskData changes
  useEffect(() => {
    setTaskFields(initializeTaskFields());
  }, [initialTaskData, selectedDate, selectedTruck, selectedDriver]);

  // Function to reset form fields
  const resetFormFields = () => {
    setTaskFields(initializeTaskFields());
  };

  const handleInputChange = (name, value) => {
    setTaskFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    let data = {};
    Object.keys(taskFields).forEach((key) => {
      data[key] = taskFields[key];
    });

    if (initialTaskData) {
      console.log("Update task data", data);
      dispatch(updateTask(data));
      dispatch(setShowServiceTaskModal(false));
    } else {
      console.log("Create task data", data);
      dispatch(createTask(data));
    }

    // Reset form fields after submission
    resetFormFields();
    onCloseModal();
  };

  useEffect(() => {
    if (!initialTaskData) {
      // Reset form fields whenever the modal is opened for a new task
      resetFormFields();
    }
  }, [initialTaskData]);

  return (
    <>
      <div className="add-task-container add-service-task">
        <div className="add-task-details">
          <form onSubmit={handleFormSubmit} className="add-task-form">
            <div className="add-task-details__content">
              <div className="add-task-details__content-block">
                {formFields.map((rowFields, rowIndex) => (
                  <div
                    className="add-task-details__row"
                    key={`row-${rowIndex}`}
                  >
                    {rowFields.map((field) => {
                      const {
                        id,
                        title,
                        placeholder,
                        component,
                        type,
                        condition,
                        required,
                      } = field;

                      // Check if the condition is met (if provided)
                      if (condition && !condition(taskFields)) {
                        return null;
                      }

                      let options = [];
                      if (id === TASK_CONSTANTS.TASK_TYPE) {
                        options = taskTypesOptions;
                      } else if (id === TASK_CONSTANTS.TASK_TRUCK) {
                        options = trucksOptions;
                      } else if (id === TASK_CONSTANTS.TASK_DRIVER) {
                        options = driversOptions;
                      }

                      if (
                        component === "select" &&
                        id === TASK_CONSTANTS.TASK_TYPE
                      ) {
                        return (
                          <div
                            className="add-task-details__content-row-block"
                            key={id}
                          >
                            <div className="add-task-details__row-block">
                              <TaskTypeSelect
                                label={title}
                                id={id}
                                title={title}
                                value={taskFields[id]}
                                options={options}
                                onChange={(value) =>
                                  handleInputChange(id, value)
                                }
                              />
                            </div>
                          </div>
                        );
                      }

                      return component === "select" ? (
                        <div
                          className="add-task-details__content-row-block"
                          key={id}
                        >
                          <div className="add-task-details__row-block">
                            <SelectComponent
                              label={title}
                              id={id}
                              name={id}
                              title={title}
                              placeholder={placeholder}
                              value={taskFields[id]}
                              options={options}
                              onChange={(e) =>
                                handleInputChange(id, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div
                          className="add-task-details__content-row-block"
                          key={id}
                        >
                          <div className="add-task-details__row-block">
                            <InputComponent
                              label={title}
                              id={id}
                              name={id}
                              title={title}
                              type={type}
                              placeholder={placeholder}
                              value={taskFields[id]}
                              onChange={(e) =>
                                handleInputChange(id, e.target.value)
                              }
                              required={required}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <AddServiceTaskFooterComponent onCloseModal={onCloseModal} />
          </form>
        </div>
      </div>
    </>
  );
};

export default AddServiceTaskComponent;
