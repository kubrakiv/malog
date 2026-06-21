import { useState } from "react";
import { useDispatch } from "react-redux";
import { FaPencilAlt, FaPlus, FaRegTrashAlt, FaSync } from "react-icons/fa";
import cn from "classnames";
import SearchComponent from "../../../globalComponents/SearchComponent";

import TrailerModalComponent from "../TrailerModalComponent";
import AddTrailerModalComponent from "../AddTrailerModalComponent";

import {
  setSelectedTrailer,
  setShowTrailerModal,
  setShowAddTrailerModal,
  setEditModeTrailer,
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
    dispatch(setShowTrailerModal(true));
    dispatch(setSelectedTrailer(trailer));
  };

  const handleAddTrailerButton = () => {
    dispatch(setShowAddTrailerModal(true));
  };

  const handleEditSelected = () => {
    if (selectedTrailers.length !== 1) return;
    const trailer = trailers.find((t) => t.id === selectedTrailers[0]);
    if (!trailer) return;
    dispatch(setSelectedTrailer(trailer));
    dispatch(setEditModeTrailer(true));
    dispatch(setShowTrailerModal(true));
  };

  const handleDeleteSelectedTrailers = async () => {
    if (selectedTrailers.length === 0) {
      window.alert("Виберіть причіп для видалення");
      return;
    }
    if (!window.confirm("Are you sure you want to delete selected trailers?")) return;

    try {
      for (let trailerID of selectedTrailers) {
        await dispatch(deleteTrailer(trailerID)).unwrap();
      }
      setSelectedTrailers([]);
      await dispatch(listTrailers());
    } catch (error) {
      console.error("Error deleting trailers:", error.message);
    }
  };

  return (
    <>
      <TrailerModalComponent />
      <AddTrailerModalComponent />
      <div className="fleet-panel">
        <div className="fleet-toolbar">
          <div className="fleet-toolbar__search">
            <SearchComponent search={search} setSearch={setSearch} placeholder="пошук причепів" />
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button className="fleet-toolbar__btn fleet-toolbar__btn--add" title="Додати причіп" onClick={handleAddTrailerButton} type="button"><FaPlus /></button>
            <button className="fleet-toolbar__btn fleet-toolbar__btn--delete" title="Видалити вибрані" onClick={handleDeleteSelectedTrailers} type="button"><FaRegTrashAlt /></button>
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--edit"
              title={selectedTrailers.length === 1 ? "Редагувати причіп" : "Подвійний клік для редагування"}
              onClick={handleEditSelected}
              disabled={selectedTrailers.length !== 1}
              type="button"
            >
              <FaPencilAlt />
            </button>
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button className="fleet-toolbar__btn fleet-toolbar__btn--sovtes" title="Синхронізація зі Sovtes" onClick={() => dispatch(setShowSovtesSyncModal({ show: true, tab: "trailers" }))} type="button"><FaSync /></button>
          </div>
          {selectedTrailers.length > 0 && (
            <span className="fleet-toolbar__badge">{selectedTrailers.length} обрано</span>
          )}
        </div>

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
