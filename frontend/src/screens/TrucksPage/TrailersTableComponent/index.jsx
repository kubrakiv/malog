import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaPencilAlt, FaPlus, FaRegTrashAlt, FaSave } from "react-icons/fa";
import cn from "classnames";

import TrailerModalComponent from "../TrailerModalComponent";
import AddTrailerModalComponent from "../AddTrailerModalComponent";

import {
  setSelectedTrailer,
  setShowTrailerModal,
  setShowAddTrailerModal,
} from "../../../features/trailers/trailersSlice";

import {
  listTrailers,
  deleteTrailer,
} from "../../../features/trailers/trailersOperations";

import "./style.scss";

const TrailersTableComponent = ({ trailers }) => {
  const dispatch = useDispatch();
  const [selectedTrailers, setSelectedTrailers] = useState([]);
  const [search, setSearch] = useState("");

  const handleCheckBoxChange = (trailerID) => {
    setSelectedTrailers((prev) => {
      if (prev.includes(trailerID)) {
        return prev.filter((id) => id !== trailerID);
      }
      return [...prev, trailerID];
    });
  };

  const handleRowDoubleClick = (e, trailer) => {
    e.stopPropagation();
    console.log("double click for trailer", trailer);

    dispatch(setShowTrailerModal(true));
    dispatch(setSelectedTrailer(trailer));
  };

  const handleAddTrailerButton = () => {
    dispatch(setShowAddTrailerModal(true));
  };

  const handleDeleteSelectedTrailers = async () => {
    if (selectedTrailers.length === 0) {
      window.alert("Виберіть автомобіль для видалення");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this truck?"
    );
    if (!confirmDelete) {
      return;
    }

    if (confirmDelete) {
      try {
        for (let trailerID of selectedTrailers) {
          await dispatch(deleteTrailer(trailerID)).unwrap();
        }
        setSelectedTrailers([]);
        await dispatch(listTrailers());
      } catch (error) {
        console.error("Error deleting trucks:", error.message);
      }
    }
  };

  return (
    <>
      <TrailerModalComponent />
      <AddTrailerModalComponent />
      <div className="trailers-container">
        <div className="trailers-header-block__buttons-container">
          <button
            className="trailers-header-block__add-driver-btn"
            title="Додати причіп"
            onClick={handleAddTrailerButton}
          >
            <FaPlus />
          </button>
          <button
            className="trailers-header-block__delete-driver-btn"
            title="Видалити вибрані причепи"
            onClick={handleDeleteSelectedTrailers}
          >
            <FaRegTrashAlt />
          </button>
          <button
            className="trailers-header-block__edit-driver-btn"
            title="Редагувати причіп"
            // onClick={() =>
            //   handleChangeMode(
            //     selectedTrucks.length === 1 ? selectedTrucks[0] : null
            //   )
            // }
          >
            <FaPencilAlt />
          </button>
        </div>
        <div className="table-container">
          <table className="trailers-table">
            <thead className="trailers-table__header">
              <tr className="trailers-table__head-row">
                <th className="trailers-table__head-th">ID</th>
                <th className="trailers-table__head-th">Марка</th>
                <th className="trailers-table__head-th">Державний номер</th>
                <th className="trailers-table__head-th">Рік випуску</th>
                <th className="trailers-table__head-th">VIN</th>
                <th className="trailers-table__head-th"></th>
              </tr>
            </thead>
            <tbody className="trailers-table__body">
              {trailers
                .filter((trailer) => {
                  const searchTerm = search.toLowerCase();
                  return (
                    searchTerm === "" ||
                    trailer.plates.toLowerCase().includes(searchTerm)
                  );
                })
                .map((trailer, index) => (
                  <tr
                    key={trailer.id}
                    className={cn("drivers-table__body-row", {
                      "drivers-table__body-row_active":
                        selectedTrailers.includes(trailer.id),
                    })}
                    onDoubleClick={(e) => handleRowDoubleClick(e, trailer)}
                  >
                    <td className="trailers-table__body-td">{index + 1}</td>
                    <td className="trailers-table__body-td">{trailer.brand}</td>
                    <td className="trailers-table__body-td">
                      {trailer.plates}
                    </td>
                    <td className="trailers-table__body-td">{trailer.year}</td>
                    <td className="trailers-table__body-td">
                      {trailer.vin_code}
                    </td>

                    <td className="trailers-table__body-td">
                      <input
                        type="checkbox"
                        className="trailers-table__checkbox"
                        checked={selectedTrailers.includes(trailer.id)}
                        onChange={() => handleCheckBoxChange(trailer.id)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TrailersTableComponent;
