import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaPencilAlt, FaPlus, FaRegTrashAlt, FaSync } from "react-icons/fa";
import cn from "classnames";
import SearchComponent from "../../../globalComponents/SearchComponent";

import TrailerModalComponent from "../TrailerModalComponent";
import AddTrailerModalComponent from "../AddTrailerModalComponent";
import SovtesSyncModal from "../SovtesSyncModal";

import {
  setSelectedTrailer,
  setShowTrailerModal,
  setShowAddTrailerModal,
} from "../../../features/trailers/trailersSlice";

import {
  listTrailers,
  deleteTrailer,
} from "../../../features/trailers/trailersOperations";

import { setShowSovtesSyncModal } from "../../../features/sovtesFleet/sovtesFleetSlice";

import "./style.scss";

const SyncBadge = ({ sovtesId }) => {
  if (sovtesId) {
    return (
      <span className="fleet-sync-badge fleet-sync-badge--sovtes">
        <FaSync />
        Sovtes
      </span>
    );
  }
  return (
    <span className="fleet-sync-badge fleet-sync-badge--manual">Вручну</span>
  );
};

const TrailersTableComponent = ({ trailers }) => {
  const dispatch = useDispatch();
  const [selectedTrailers, setSelectedTrailers] = useState([]);
  const [search, setSearch] = useState("");
  const [heroToolsHost, setHeroToolsHost] = useState(null);

  const showSovtesModal = useSelector(
    (state) => state.sovtesFleetInfo.showModal
  );

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
      "Are you sure you want to delete this truck?",
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

  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      setHeroToolsHost(document.getElementById("fleet-hero-tools"));
    }
  }, []);

  const controls = (
    <div className="fleet-panel__actions fleet-panel__actions--in-hero">
      <div className="fleet-panel__tools">
        <div className="fleet-panel__action-group">
          <button
            className="fleet-panel__action-btn fleet-panel__action-btn--add"
            title="Додати причіп"
            onClick={handleAddTrailerButton}
            type="button"
          >
            <FaPlus />
            <span>Додати</span>
          </button>
          <button
            className="fleet-panel__action-btn fleet-panel__action-btn--delete"
            title="Видалити вибрані причепи"
            onClick={handleDeleteSelectedTrailers}
            type="button"
          >
            <FaRegTrashAlt />
            <span>Видалити</span>
          </button>
          <button
            className="fleet-panel__action-btn fleet-panel__action-btn--edit"
            title="Редагування доступне через подвійний клік по рядку"
            type="button"
            disabled
          >
            <FaPencilAlt />
            <span>Подвійний клік</span>
          </button>
          <button
            className="fleet-panel__action-btn fleet-panel__action-btn--sovtes"
            title="Синхронізувати зі Sovtes"
            onClick={() => dispatch(setShowSovtesSyncModal(true))}
            type="button"
          >
            <FaSync />
            <span>Sovtes</span>
          </button>
        </div>

        <div className="fleet-panel__search-inline">
          <SearchComponent
            search={search}
            setSearch={setSearch}
            placeholder={"пошук авто"}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <TrailerModalComponent />
      <AddTrailerModalComponent />
      {showSovtesModal && <SovtesSyncModal />}
      <div className="fleet-panel">
        {heroToolsHost && createPortal(controls, heroToolsHost)}

        <div className="fleet-panel__table-card">
          <div className="table-container fleet-panel__table-wrap">
            <table className="trailers-table">
              <thead className="trailers-table__header">
                <tr className="trailers-table__head-row">
                  <th className="trailers-table__head-th">ID</th>
                  <th className="trailers-table__head-th">Марка</th>
                  <th className="trailers-table__head-th">Державний номер</th>
                  <th className="trailers-table__head-th">Рік випуску</th>
                  <th className="trailers-table__head-th">VIN</th>
                  <th className="trailers-table__head-th">Джерело</th>
                  <th className="trailers-table__head-th"></th>
                </tr>
              </thead>
              <tbody className="trailers-table__body">
                {trailers
                  .filter((trailer) => {
                    const searchTerm = search.toLowerCase();
                    return (
                      searchTerm === "" ||
                      trailer.plates.toLowerCase().includes(searchTerm) ||
                      trailer.brand.toLowerCase().includes(searchTerm)
                    );
                  })
                  .map((trailer, index) => (
                    <tr
                      key={trailer.id}
                      className={cn("trailers-table__body-row", {
                        "trailers-table__body-row_active":
                          selectedTrailers.includes(trailer.id),
                      })}
                      onDoubleClick={(e) => handleRowDoubleClick(e, trailer)}
                    >
                      <td className="trailers-table__body-td">{index + 1}</td>
                      <td className="trailers-table__body-td">
                        {trailer.brand}
                      </td>
                      <td className="trailers-table__body-td">
                        {trailer.plates}
                      </td>
                      <td className="trailers-table__body-td">
                        {trailer.year}
                      </td>
                      <td className="trailers-table__body-td">
                        {trailer.vin_code}
                      </td>
                      <td className="trailers-table__body-td">
                        <SyncBadge sovtesId={trailer.sovtes_id} />
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
      </div>
    </>
  );
};

export default TrailersTableComponent;
