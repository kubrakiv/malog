import { useState, useEffect } from "react";
import { FaPlus, FaPencilAlt, FaRegTrashAlt } from "react-icons/fa";
import cn from "classnames";
import { useConfirm } from "../../globalComponents/ConfirmModal/useConfirm";
import AddPointModalComponent from "../AddPoint/AddPointModalComponent/AddPointModalComponent";
import PointModalComponent from "../PointModalComponent";

import { useDispatch, useSelector } from "react-redux";
import {
  listPoints,
  deletePoint,
} from "../../features/points/pointsOperations";
import {
  setEditModePoint,
  setSelectedPoint,
} from "../../features/points/pointsSlice";

import "./PointTableComponent.scss";

const PointTableComponent = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const points = useSelector((state) => state.pointsInfo.points.data);

  const [search, setSearch] = useState("");
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [showPointModal, setShowPointModal] = useState(false);
  const [showAddPointModal, setShowAddPointModal] = useState(false);

  useEffect(() => {
    dispatch(listPoints());
  }, []);

  const filtered = (points || []).filter((item) => {
    const s = search.toLowerCase();
    return (
      s === "" ||
      item.company_name?.toLowerCase()?.includes(s) ||
      item.city?.toLowerCase()?.includes(s) ||
      item.country?.toLowerCase()?.includes(s) ||
      item.customer?.toLowerCase()?.includes(s) ||
      item.postal_code?.toLowerCase()?.includes(s)
    );
  });

  const handleCheckboxChange = (pointId) => {
    setSelectedPoints((prev) =>
      prev.includes(pointId)
        ? prev.filter((id) => id !== pointId)
        : [...prev, pointId]
    );
  };

  const handleRowDoubleClick = (e, point) => {
    e.stopPropagation();
    setShowPointModal(true);
    dispatch(setSelectedPoint(point));
  };

  const handleAddPoint = () => {
    setShowAddPointModal(true);
  };

  const handleEditSelected = () => {
    const point = (points || []).find((p) => p.id === selectedPoints[0]);
    if (!point) return;
    dispatch(setEditModePoint(true));
    dispatch(setSelectedPoint(point));
    setShowAddPointModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedPoints.length === 0) return;
    const confirmed = await confirm(
      `Видалити ${selectedPoints.length > 1 ? `${selectedPoints.length} пункти` : "цей пункт"}?`,
      { title: "Видалення пунктів", confirmLabel: "Видалити" }
    );
    if (!confirmed) return;
    try {
      for (const id of selectedPoints) {
        await dispatch(deletePoint(id)).unwrap();
      }
      setSelectedPoints([]);
      dispatch(listPoints());
    } catch (err) {
      console.log("Error deleting point:", err.message);
    }
  };

  return (
    <>
      {showPointModal && (
        <PointModalComponent
          showPointModal={showPointModal}
          setShowPointModal={setShowPointModal}
        />
      )}
      {showAddPointModal && (
        <AddPointModalComponent
          showAddPointModal={showAddPointModal}
          setShowAddPointModal={setShowAddPointModal}
        />
      )}

      <div className="points-page">
        {/* Hero */}
        <div className="points-page__hero">
          <h2 className="points-page__title">
            Пункти завантаження/розвантаження
          </h2>
          <span className="points-page__count-chip">
            {filtered.length} пунктів
          </span>
        </div>

        {/* Toolbar */}
        <div className="fleet-toolbar">
          <input
            className="fleet-toolbar__search-input"
            type="text"
            placeholder="Пошук по індексу, місту, компанії..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="fleet-toolbar__sep" />

          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--add"
              title="Додати пункт"
              onClick={handleAddPoint}
              type="button"
            >
              <FaPlus />
            </button>
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--delete"
              title="Видалити вибрані"
              onClick={handleDeleteSelected}
              disabled={selectedPoints.length === 0}
              type="button"
            >
              <FaRegTrashAlt />
            </button>
          </div>

          <div className="fleet-toolbar__sep" />

          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--edit"
              title="Редагувати пункт"
              onClick={handleEditSelected}
              disabled={selectedPoints.length !== 1}
              type="button"
            >
              <FaPencilAlt />
            </button>
          </div>

          {selectedPoints.length > 0 && (
            <span className="fleet-toolbar__badge">
              {selectedPoints.length} обрано
            </span>
          )}
        </div>

        {/* Table */}
        <div className="points-page__table-card">
          <div className="points-page__table-wrap">
            <table className="points-table">
              <thead className="points-table__header">
                <tr className="points-table__head-row">
                  <th className="points-table__head-th">Замовник</th>
                  <th className="points-table__head-th">Компанія</th>
                  <th className="points-table__head-th">Індекс</th>
                  <th className="points-table__head-th">Країна</th>
                  <th className="points-table__head-th">Місто</th>
                  <th className="points-table__head-th">Вулиця</th>
                  <th className="points-table__head-th">Будинок</th>
                  <th className="points-table__head-th"></th>
                </tr>
              </thead>
              <tbody className="points-table__body">
                {filtered.map((point) => (
                  <tr
                    key={point.id}
                    className={cn("points-table__body-row", {
                      "points-table__body-row--active": selectedPoints.includes(point.id),
                    })}
                    onDoubleClick={(e) => handleRowDoubleClick(e, point)}
                    onClick={() => handleCheckboxChange(point.id)}
                  >
                    <td className="points-table__body-td">{point.customer}</td>
                    <td className="points-table__body-td points-table__body-td--name">
                      {point.company_name}
                    </td>
                    <td className="points-table__body-td">{point.postal_code}</td>
                    <td className="points-table__body-td">{point.country}</td>
                    <td className="points-table__body-td">{point.city}</td>
                    <td className="points-table__body-td">{point.street}</td>
                    <td className="points-table__body-td">{point.street_number}</td>
                    <td className="points-table__body-td points-table__body-td--check">
                      <input
                        type="checkbox"
                        className="points-table__checkbox"
                        checked={selectedPoints.includes(point.id)}
                        onChange={() => handleCheckboxChange(point.id)}
                        onClick={(e) => e.stopPropagation()}
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

export default PointTableComponent;
