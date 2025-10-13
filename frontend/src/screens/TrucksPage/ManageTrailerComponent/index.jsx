import { useState } from "react";
import { useDispatch } from "react-redux";
import cn from "classnames";

import {
  createTrailer,
  updateTrailer,
} from "../../../features/trailers/trailersOperations";

import {
  setEditModeTrailer,
  setSelectedTrailer,
} from "../../../features/trailers/trailersSlice";

import { formFields } from "./trailerFormFields.jsx";
import { formatDateForInput } from "../../../utils/formatDate";

import ManageTrailerFooterComponent from "../ManageTrailerFooterComponent";
import InputComponent from "../../../globalComponents/InputComponent";

import "./style.scss";

import { TRAILER_CONSTANTS } from "../../../constants/global";

const ManageTrailerComponent = ({
  onCloseModal,
  onEditMode,
  initialTrailerData = null,
}) => {
  const dispatch = useDispatch();

  const [trailerFields, setTrailerFields] = useState(() => {
    if (initialTrailerData) {
      return {
        ...initialTrailerData,
      };
    }

    return Object.values(TRAILER_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {});
  });

  const handleTrailerChange = (e) => {
    const { name, value } = e.target;
    setTrailerFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    let data = {};
    Object.keys(trailerFields).forEach((key) => {
      data[key] = trailerFields[key];
    });

    console.log("Trailer data", data);

    if (initialTrailerData) {
      dispatch(updateTrailer(data));
      dispatch(setSelectedTrailer(data));
      dispatch(setEditModeTrailer(false));
    } else {
      dispatch(createTrailer(data));
      onCloseModal();
    }
  };

  return (
    <>
      <form className="add-trailer__form" onSubmit={(e) => handleFormSubmit(e)}>
        <div className="truck-card-container">
          <div className="truck-card-details">
            <div className="add-trailer__content">
              <div className="add-trailer__content-block">
                {!onEditMode && (
                  <h3 className="add-trailer__title">Додати причіп</h3>
                )}
                <div className="add-trailer__content-row">
                  {formFields.map((fields) => (
                    <div
                      className={cn(
                        "add-trailer__content-row-block",
                        initialTrailerData !== null &&
                          "add-trailer__content-row-block_edit-mode"
                      )}
                      key={`fields-row-${fields[0].id}`}
                    >
                      {fields.map((field) => {
                        return (
                          <div key={field.id}>
                            <InputComponent
                              label={field.title}
                              id={field.id}
                              type={field.type}
                              name={field.id}
                              title={field.title}
                              placeholder={field.placeholder}
                              value={
                                field.type !== "date"
                                  ? trailerFields[field.id]
                                  : formatDateForInput(trailerFields[field.id])
                              }
                              onChange={(e) => handleTrailerChange(e)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {!initialTrailerData && (
              <ManageTrailerFooterComponent onCloseModal={onCloseModal} />
            )}
            {initialTrailerData && (
              <div className="edit-trailer__footer">
                <button
                  title={initialTrailerData && "Оновити причіп"}
                  style={{ margin: "0px 0px 5px 5px" }}
                  className="end-time__footer-btn end-time__footer-btn_save"
                  type="submit"
                  // disabled={initialTrailerData ? isFormValid : !isFormValid}
                >
                  {initialTrailerData && "Оновити причіп"}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  );
};

export default ManageTrailerComponent;
