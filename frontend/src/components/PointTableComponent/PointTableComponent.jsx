import { useState, useEffect } from "react";
import { FaPencilAlt, FaRegTrashAlt } from "react-icons/fa";
import AddPointModalComponent from "../AddPoint/AddPointModalComponent/AddPointModalComponent";
import PointSearchComponent from "../PointSearchComponent/PointSearchComponent";
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

  const points = useSelector((state) => state.pointsInfo.points.data);

  const [search, setSearch] = useState("");
  const [showPointModal, setShowPointModal] = useState(false);
  const [showAddPointModal, setShowAddPointModal] = useState(false);

  useEffect(() => {
    dispatch(listPoints());
  }, []);

  const handleRowDoubleClick = (e, point) => {
    e.stopPropagation();
    console.log("Row double click:", point);
    setShowPointModal(true);
    dispatch(setSelectedPoint(point));
  };

  const handleAddPointButtonClick = (e) => {
    e.stopPropagation();
    setShowAddPointModal(true);
  };

  const handleEditModeButton = (e, point) => {
    e.stopPropagation();
    dispatch(setEditModePoint(true));
    dispatch(setSelectedPoint(point));
    setShowAddPointModal(true);
  };

  const handleDeletePoint = async (e, pointId) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this point?"
    );
    if (!confirmDelete) {
      return;
    }

    try {
      dispatch(deletePoint(pointId)).unwrap();
      console.log(`Point with ID ${pointId} was deleted successfully.`);

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
      <div className="points-container">
        <div className="points-header-block">
          <h2 className="table__name">Мої пункти завантаження/розвантаження</h2>
          <button
            className="points-header-block__add-point-btn"
            onClick={handleAddPointButtonClick}
          >
            Створити пункт
          </button>
        </div>
        <PointSearchComponent search={search} setSearch={setSearch} />
        <div className="table-container">
          <table className="points-table">
            <thead className="points-table__header">
              <tr className="points-table__head-row">
                <th className="points-table__head-th">ID</th>
                <th className="points-table__head-th">Customer</th>
                <th className="points-table__head-th">Company Name</th>
                <th className="points-table__head-th">Postal Code</th>
                <th className="points-table__head-th">Country</th>
                <th className="points-table__head-th">City</th>
                <th className="points-table__head-th">Street</th>
                <th className="points-table__head-th">Street Number</th>
                <th className="points-table__head-th">Actions</th>
              </tr>
            </thead>
            <tbody data-link="row" className="points-table__body">
              {points
                .filter((item) => {
                  const searchTerm = search.toLowerCase();
                  return (
                    searchTerm === "" ||
                    item.company_name?.toLowerCase()?.includes(searchTerm) ||
                    item.city?.toLowerCase()?.includes(searchTerm) ||
                    item.country?.toLowerCase()?.includes(searchTerm) ||
                    item.customer?.toLowerCase()?.includes(searchTerm)
                  );
                })
                .map((point) => (
                  <tr
                    key={point.id}
                    className="points-table__body-row"
                    onDoubleClick={(e) => handleRowDoubleClick(e, point)}
                  >
                    <td className="points-table__body-td">{point.id}</td>
                    <td className="points-table__body-td">{point.customer}</td>
                    <td className="points-table__body-td">
                      {point.company_name}
                    </td>
                    <td className="points-table__body-td">
                      {point.postal_code}
                    </td>
                    <td className="points-table__body-td">{point.country}</td>
                    <td className="points-table__body-td">{point.city}</td>
                    <td className="points-table__body-td">{point.street}</td>
                    <td className="points-table__body-td">
                      {point.street_number}
                    </td>

                    <td className="points-table__body-td">
                      <button
                        title="Edit point"
                        className="points-table__btn points-table__btn_edit"
                        onClick={(e) => handleEditModeButton(e, point)}
                      >
                        <FaPencilAlt />
                      </button>
                      <button
                        title="Delete point"
                        className="points-table__btn points-table__btn_delete"
                        onClick={(e) => handleDeletePoint(e, point.id)}
                      >
                        <FaRegTrashAlt />
                      </button>
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

export default PointTableComponent;
