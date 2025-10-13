import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaCheck,
  FaPencilAlt,
  FaPlus,
  FaRegTrashAlt,
  FaSave,
} from "react-icons/fa";
import cn from "classnames";
import { transformSelectOptions } from "../../../utils/transformers";

import SelectComponent from "../../../globalComponents/SelectComponent";
import TruckModalComponent from "../TruckModalComponent";
import AddTruckModalComponent from "../AddTruckModalComponent";

import {
  deleteTruck,
  listTrucks,
  updateTruckTrailerAndDriver,
} from "../../../features/trucks/trucksOperations";

import { selectSelectedTruck } from "../../../features/trucks/trucksSelectors";
import {
  setShowAddTruckModal,
  setShowTruckModal,
  setSelectedTruck,
} from "../../../features/trucks/trucksSlice";

import "./style.scss";
import { set } from "date-fns";

const TrucksTableComponent = ({ trucks, trailers, drivers }) => {
  const dispatch = useDispatch();
  const selectedTruck = useSelector(selectSelectedTruck);
  const userInfo = useSelector((state) => state.userLogin.userInfo);

  const trailerOptions = transformSelectOptions(trailers, "plates");
  const driverOptions = transformSelectOptions(drivers, "full_name");

  const [changeMode, setChangeMode] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedTrucks, setSelectedTrucks] = useState([]);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const handleCheckBoxChange = (truckID) => {
    setSelectedTrucks((prev) => {
      if (prev.includes(truckID)) {
        return prev.filter((id) => id !== truckID);
      }
      return [...prev, truckID];
    });
  };

  const handleRowDoubleClick = (e, truck) => {
    e.stopPropagation();

    dispatch(setShowTruckModal(true));
    dispatch(setSelectedTruck(truck));
  };

  const handleChangeMode = (truck) => {
    setChangeMode((prev) => !prev);
    dispatch(setSelectedTruck(truck));

    const selectedTruck = trucks.find((t) => t.id === truck);

    // Set the current trailer and driver as default selected values
    setSelectedTrailer(selectedTruck.trailer || null);
    setSelectedDriver(selectedTruck.driver_details?.full_name || null);
  };

  const handleSaveChanges = () => {
    const updatedData = {
      id: selectedTruck,
      trailer: selectedTrailer,
      driver: selectedDriver,
    };
    console.log("updatedData", updatedData);

    dispatch(updateTruckTrailerAndDriver(updatedData));

    setChangeMode(false);
    setSelectedTrucks([]);
    setSelectedTrailer(null);
    setSelectedDriver(null);
  };

  const handleAddTruckButton = () => {
    dispatch(setShowAddTruckModal(true));
  };

  const handleDeleteSelectedTrucks = () => {
    if (selectedTrucks.length === 0) {
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

  return (
    <>
      <TruckModalComponent selectedTruck={selectedTruck} />
      <AddTruckModalComponent />
      <div className="trucks-container">
        <div className="trucks-header-block__buttons-container">
          <button
            className="trucks-header-block__add-driver-btn"
            title="Додати автомобіль"
            onClick={handleAddTruckButton}
          >
            <FaPlus />
          </button>
          {userInfo.role === "admin" && (
            <button
              className="trucks-header-block__delete-driver-btn"
              title="Видалити вибрані автомобілі"
              onClick={handleDeleteSelectedTrucks}
            >
              <FaRegTrashAlt />
            </button>
          )}
          <button
            className="trucks-header-block__edit-driver-btn"
            title="Редагувати автомобіль"
            onClick={() =>
              handleChangeMode(
                selectedTrucks.length === 1 ? selectedTrucks[0] : null
              )
            }
            disabled={selectedTrucks.length !== 1}
          >
            <FaPencilAlt />
          </button>
          {changeMode && (
            <button
              className="trucks-header-block__save-driver-btn"
              title="Зберегти зміни"
              onClick={handleSaveChanges}
            >
              <FaSave />
            </button>
          )}
        </div>
        <div className="table-container">
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
                <th className="trucks-table__head-th"></th>
              </tr>
            </thead>
            <tbody className="trucks-table__body">
              {trucks
                .filter((truck) => {
                  const searchTerm = search.toLowerCase();
                  return (
                    searchTerm === "" ||
                    truck.plates.toLowerCase().includes(searchTerm)
                  );
                })
                .map((truck, index) => (
                  <tr
                    key={truck.id}
                    className={cn("drivers-table__body-row", {
                      "drivers-table__body-row_active": selectedTrucks.includes(
                        truck.id
                      ),
                    })}
                    onDoubleClick={(e) => handleRowDoubleClick(e, truck)}
                  >
                    <td className="trucks-table__body-td">{index + 1}</td>
                    <td className="trucks-table__body-td">
                      {truck.brand} {truck.model}
                    </td>
                    <td className="trucks-table__body-td">{truck.plates}</td>
                    <td className="trucks-table__body-td">
                      {changeMode && truck.id === selectedTruck ? (
                        <SelectComponent
                          options={[
                            { label: "Без причіпу", value: "" },
                            ...trailerOptions,
                          ]}
                          placeholder={"Виберіть причіп"}
                          title={"Виберіть причіп"}
                          value={selectedTrailer || ""}
                          onChange={(e) => setSelectedTrailer(e.target.value)}
                        />
                      ) : (
                        truck.trailer
                      )}
                    </td>
                    <td className="trucks-table__body-td">
                      {changeMode && truck.id === selectedTruck ? (
                        <SelectComponent
                          options={[
                            { label: "Без водія", value: "" },
                            ...driverOptions,
                          ]}
                          placeholder={"Виберіть водія"}
                          title={"Виберіть водія"}
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                        />
                      ) : (
                        truck.driver_details?.full_name
                      )}
                    </td>
                    <td className="trucks-table__body-td">{truck.year}</td>
                    <td className="trucks-table__body-td">{truck.vin_code}</td>
                    <td className="trucks-table__body-td">
                      {truck.gps_id ? (
                        <FaCheck style={{ color: "green" }} />
                      ) : (
                        <FaCheck style={{ color: "red" }} />
                      )}
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
    </>
  );
};

export default TrucksTableComponent;
