import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaCheck,
  FaLink,
  FaPencilAlt,
  FaPlus,
  FaRegTrashAlt,
  FaSave,
  FaSync,
} from "react-icons/fa";
import cn from "classnames";
import { transformSelectOptions } from "../../../utils/transformers";

import SelectComponent from "../../../globalComponents/SelectComponent";
import SearchComponent from "../../../globalComponents/SearchComponent";
import TruckModalComponent from "../TruckModalComponent";
import AddTruckModalComponent from "../AddTruckModalComponent";
import SovtesSyncModal from "../SovtesSyncModal";

import {
  deleteTruck,
  listTrucks,
  updateTruckTrailerAndDriver,
} from "../../../features/trucks/trucksOperations";

import { selectSelectedTruck } from "../../../features/trucks/trucksSelectors";
import {
  setEditModeTruck,
  setShowAddTruckModal,
  setShowTruckModal,
  setSelectedTruck,
} from "../../../features/trucks/trucksSlice";

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

const TrucksTableComponent = ({ trucks, trailers, drivers }) => {
  const dispatch = useDispatch();
  const selectedTruck = useSelector(selectSelectedTruck);
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const showSovtesModal = useSelector(
    (state) => state.sovtesFleetInfo.showModal
  );

  const trailerOptions = transformSelectOptions(trailers, "plates");
  const driverOptions = transformSelectOptions(drivers, "full_name");

  const [search, setSearch] = useState("");
  const [heroToolsHost, setHeroToolsHost] = useState(null);
  const [selectedTrucks, setSelectedTrucks] = useState([]);
  const [assignMode, setAssignMode] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const handleCheckBoxChange = (truckID) => {
    setSelectedTrucks((prev) =>
      prev.includes(truckID) ? prev.filter((id) => id !== truckID) : [...prev, truckID]
    );
  };

  const handleRowDoubleClick = (e, truck) => {
    e.stopPropagation();
    dispatch(setEditModeTruck(true));
    dispatch(setShowTruckModal(true));
    dispatch(setSelectedTruck(truck));
  };

  const handleAssignMode = () => {
    if (selectedTrucks.length !== 1) return;
    const truck = trucks.find((t) => t.id === selectedTrucks[0]);
    dispatch(setSelectedTruck(truck.id));
    setSelectedTrailer(truck.trailer || null);
    setSelectedDriver(truck.driver_details?.full_name || null);
    setAssignMode(true);
  };

  const handleSaveAssignment = () => {
    const updatedData = {
      id: selectedTruck,
      trailer: selectedTrailer,
      driver: selectedDriver,
    };
    dispatch(updateTruckTrailerAndDriver(updatedData));
    setAssignMode(false);
    setSelectedTrucks([]);
    setSelectedTrailer(null);
    setSelectedDriver(null);
  };

  const handleCancelAssignment = () => {
    setAssignMode(false);
    setSelectedTrailer(null);
    setSelectedDriver(null);
  };

  const handleAddTruckButton = () => {
    dispatch(setEditModeTruck(false));
    dispatch(setShowAddTruckModal(true));
  };

  const handleEditSelected = () => {
    const truck = trucks.find((t) => t.id === selectedTrucks[0]);
    if (!truck) return;
    dispatch(setEditModeTruck(true));
    dispatch(setShowTruckModal(true));
    dispatch(setSelectedTruck(truck));
  };

  const handleDeleteSelectedTrucks = () => {
    if (selectedTrucks.length === 0) {
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
        for (let truckID of selectedTrucks) {
          dispatch(deleteTruck(truckID));
        }
        setSelectedTrucks([]);
        dispatch(listTrucks());
      } catch (error) {
        console.error("Error deleting trucks:", error.message);
      }
    }
  };

  const controls = (
    <div className="fleet-panel__actions fleet-panel__actions--in-hero">
      <div className="fleet-panel__tools">
        <div className="fleet-panel__action-group">
          <button
            className="fleet-panel__action-btn fleet-panel__action-btn--add"
            title="Додати автомобіль"
            onClick={handleAddTruckButton}
            type="button"
          >
            <FaPlus />
            <span>Додати</span>
          </button>
          {["admin", "client_admin", "system_admin"].includes(userInfo?.role) && (
            <button
              className="fleet-panel__action-btn fleet-panel__action-btn--delete"
              title="Видалити вибрані автомобілі"
              onClick={handleDeleteSelectedTrucks}
              type="button"
            >
              <FaRegTrashAlt />
              <span>Видалити</span>
            </button>
          )}
          <button
            className="fleet-panel__action-btn fleet-panel__action-btn--edit"
            title="Відкрити картку автомобіля"
            onClick={handleEditSelected}
            disabled={selectedTrucks.length !== 1}
            type="button"
          >
            <FaPencilAlt />
            <span>Оновити</span>
          </button>
          {!assignMode ? (
            <button
              className="fleet-panel__action-btn fleet-panel__action-btn--assign"
              title="Прив'язати водія та причіп"
              onClick={handleAssignMode}
              disabled={selectedTrucks.length !== 1}
              type="button"
            >
              <FaLink />
              <span>Прив'язати</span>
            </button>
          ) : (
            <>
              <button
                className="fleet-panel__action-btn fleet-panel__action-btn--save"
                title="Зберегти прив'язку"
                onClick={handleSaveAssignment}
                type="button"
              >
                <FaSave />
                <span>Зберегти</span>
              </button>
              <button
                className="fleet-panel__action-btn fleet-panel__action-btn--cancel"
                title="Скасувати"
                onClick={handleCancelAssignment}
                type="button"
              >
                <span>Скасувати</span>
              </button>
            </>
          )}
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

  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      setHeroToolsHost(document.getElementById("fleet-hero-tools"));
    }
  }, []);

  return (
    <>
      <TruckModalComponent selectedTruck={selectedTruck} />
      <AddTruckModalComponent />
      {showSovtesModal && <SovtesSyncModal />}
      <div className="fleet-panel">
        {heroToolsHost && createPortal(controls, heroToolsHost)}

        <div className="fleet-panel__table-card">
          <div className="table-container fleet-panel__table-wrap">
            <table className="trucks-table">
              <thead className="trucks-table__header">
                <tr className="trucks-table__head-row">
                  <th className="trucks-table__head-th">ID</th>
                  <th className="trucks-table__head-th">Марка</th>
                  <th className="trucks-table__head-th">Номер авто</th>
                  <th className="trucks-table__head-th">Причіп</th>
                  <th className="trucks-table__head-th">Водій</th>
                  <th className="trucks-table__head-th">Рік випуску</th>
                  <th className="trucks-table__head-th">VIN</th>
                  <th className="trucks-table__head-th">GPS ID</th>
                  <th className="trucks-table__head-th">Джерело</th>
                  <th className="trucks-table__head-th"></th>
                </tr>
              </thead>
              <tbody className="trucks-table__body">
                {trucks
                  .filter((truck) => {
                    const searchTerm = search.toLowerCase();
                    return (
                      searchTerm === "" ||
                      truck.plates.toLowerCase().includes(searchTerm) ||
                      truck.brand.toLowerCase().includes(searchTerm)
                    );
                  })
                  .map((truck, index) => (
                    <tr
                      key={truck.id}
                      className={cn("trucks-table__body-row", {
                        "trucks-table__body-row_active":
                          selectedTrucks.includes(truck.id),
                      })}
                      onDoubleClick={(e) => handleRowDoubleClick(e, truck)}
                    >
                      <td className="trucks-table__body-td">{index + 1}</td>
                      <td className="trucks-table__body-td">
                        {truck.brand} {truck.model}
                      </td>
                      <td className="trucks-table__body-td">{truck.plates}</td>
                      <td className="trucks-table__body-td">
                        {assignMode && truck.id === selectedTruck ? (
                          <SelectComponent
                            options={[
                              { label: "Без причіпу", value: "" },
                              ...trailerOptions,
                            ]}
                            placeholder="Виберіть причіп"
                            title="Виберіть причіп"
                            value={selectedTrailer || ""}
                            onChange={(e) => setSelectedTrailer(e.target.value)}
                          />
                        ) : (
                          truck.trailer
                        )}
                      </td>
                      <td className="trucks-table__body-td">
                        {assignMode && truck.id === selectedTruck ? (
                          <SelectComponent
                            options={[
                              { label: "Без водія", value: "" },
                              ...driverOptions,
                            ]}
                            placeholder="Виберіть водія"
                            title="Виберіть водія"
                            value={selectedDriver || ""}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                          />
                        ) : (
                          truck.driver_details?.full_name
                        )}
                      </td>
                      <td className="trucks-table__body-td">{truck.year}</td>
                      <td className="trucks-table__body-td">
                        {truck.vin_code}
                      </td>
                      <td className="trucks-table__body-td">
                        {truck.gps_id ? (
                          <FaCheck style={{ color: "green" }} />
                        ) : (
                          <FaCheck style={{ color: "red" }} />
                        )}
                      </td>
                      <td className="trucks-table__body-td">
                        <SyncBadge sovtesId={truck.sovtes_id} />
                      </td>
                      <td className="trucks-table__body-td">
                        <input
                          type="checkbox"
                          className="trucks-table__checkbox"
                          checked={selectedTrucks.includes(truck.id)}
                          onChange={() => handleCheckBoxChange(truck.id)}
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

export default TrucksTableComponent;
