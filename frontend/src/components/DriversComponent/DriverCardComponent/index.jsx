import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import cn from "classnames";
import {
  FaPen,
  FaRegTrashAlt,
  FaIdCard,
  FaPhone,
  FaEnvelope,
  FaBirthdayCake,
  FaAddressCard,
  FaCar,
} from "react-icons/fa";

import { driverDetails } from "./driverDetailsConfig";
import { transformDate } from "../../../utils/formatDate";
import {
  deleteDriver,
  updateDriver,
} from "../../../features/drivers/driversOperations";
import {
  setShowDriverModal,
  setSelectedDriver,
} from "../../../features/drivers/driversSlice";
import EditDriverComponent from "../EditDriverComponent/EditDriverComponent";

import "./style.scss";

const DriverCardComponent = ({ driver = {}, inModal = false }) => {
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [driverFieldstoUpdate, setDriverFieldstoUpdate] = useState({});

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const handleDeleteDriver = () => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      setIsDeleting(true);
      dispatch(deleteDriver(driver.id))
        .unwrap()
        .then(() => {
          dispatch(setShowDriverModal(false));
        })
        .catch((error) => {
          console.error("Failed to delete driver:", error);
        })
        .finally(() => {
          setIsDeleting(false);
        });
    }
  };

  const handleDriverUpdate = (driverId, driverData) => {
    setIsEditing(true);
    dispatch(updateDriver({ id: driverId, ...driverData }))
      .unwrap()
      .then(() => {
        setEditMode(false);
      })
      .catch((error) => {
        console.error("Failed to update driver:", error);
      })
      .finally(() => {
        setIsEditing(false);
      });
  };

  if (!driver || !driver.id) {
    return <div>No driver data available</div>;
  }

  if (editMode) {
    return (
      <EditDriverComponent
        selectedDriver={driver}
        onSave={(updatedData) => handleDriverUpdate(driver.id, updatedData)}
        onCancel={() => setEditMode(false)}
        handleDriverUpdate={handleDriverUpdate}
        driverFieldstoUpdate={driverFieldstoUpdate}
        setDriverFieldstoUpdate={setDriverFieldstoUpdate}
        isEditDriverProfileMode={true}
      />
    );
  }

  return (
    <div className="driver-card">
      <div className="driver-card__header">
        <h3>{`${driver.first_name} ${driver.last_name}`}</h3>
        <div className="driver-card__actions">
          {userInfo && (
            <>
              <button
                className="btn-icon"
                onClick={() => setEditMode(true)}
                disabled={isEditing || isDeleting}
              >
                <FaPen />
              </button>
              <button
                className="btn-icon delete"
                onClick={handleDeleteDriver}
                disabled={isEditing || isDeleting}
              >
                <FaRegTrashAlt />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="driver-card__details">
        {driverDetails.map((section, sectionIndex) => (
          <div key={sectionIndex} className="details-section">
            <h4 className="section-title">{section.label}</h4>
            <div className="section-content">
              {section.items.map((item, itemIndex) => {
                const value = driver[item.key];
                return (
                  <div key={itemIndex} className="detail-item">
                    <div className="detail-label">
                      {item.icon && React.createElement(item.icon)}
                      <span>{item.label}</span>
                    </div>
                    <div className="detail-value">
                      {item.formatFn
                        ? item.formatFn(value)
                        : value || "Не вказано"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriverCardComponent;
