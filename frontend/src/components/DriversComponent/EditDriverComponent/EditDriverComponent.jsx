import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCsrfToken } from "../../../utils/getCsrfToken";
import AddDriverHeaderComponent from "../AddDriverHeaderComponent/AddDriverHeaderComponent";
import AddDriverFooterComponent from "../AddDriverFooterComponent/AddDriverFooterComponent";
import RegisterPage from "../../../screens/RegisterPage/RegisterPage";
import axios from "axios";
import { register } from "../../../actions/userActions";
import "./EditDriverComponent.scss";
import driverImagePlaceholder from "../../../img/driver_placeholder.jpg";
import cn from "classnames";
import { transformDateFormat } from "../../../utils/formatDate";
import { updateDriver } from "../../../actions/driverActions";

const { REACT_APP_PROXY: BASE_URL } = import.meta.env;

const EditDriverComponent = ({
  showDriverModal,
  setShowDriverModal,
  selectedDriver,
  setSelectedDriver,
  editDriverProfileMode,
  setEditDriverProfileMode,
  handleEditProfileMode,
  handleDriverUpdate,
}) => {
  const [driverImage, setDriverImage] = useState(driverImagePlaceholder);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [licenseSeries, setLicenseSeries] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");

  const dispatch = useDispatch();

  // useEffect(() => {
  //   getCsrfToken();
  // }, []);

  useEffect(() => {
    setFirstName(selectedDriver.first_name);
    setLastName(selectedDriver.last_name);
    setMiddleName(selectedDriver.middle_name);
    setEmail(selectedDriver.email);
    setPhone(selectedDriver.phone_number);
    setPosition(selectedDriver.position);
    setLicenseSeries(selectedDriver.license_series);
    setLicenseNumber(selectedDriver.license_number);
    setBirthday(selectedDriver.birth_date);
    setWorkStart(selectedDriver.work_start);
    setWorkEnd(selectedDriver.work_end);
  }, [selectedDriver]);

  const submitDriverProfile = async (
    e,
    selectedDriver,
    editDriverProfileMode
  ) => {
    e.preventDefault();

    if (editDriverProfileMode) {
      const driver = {
        profile: selectedDriver.profile,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        image: driverImage.replace(BASE_URL, ""),
        middle_name: middleName,
        email: email,
        phone_number: phone,
        position: position,
        license_series: licenseSeries,
        license_number: licenseNumber,
        birth_date: birthday,
        started_work: workStart,
        finished_work: workEnd,
      };
      // Create a copy of the driver object without the image field for the API request
      const driverForApi = { ...driver };
      delete driverForApi.image; // Remove the image field

      console.log("Driver data for API", driverForApi);

      try {
        dispatch(updateDriver(driverForApi, selectedDriver.profile)); // Send driverForApi object without image

        handleDriverUpdate(selectedDriver.profile, driver); // Pass the full driver object with image for state update
        setSelectedDriver(driver);
        setEditDriverProfileMode(false);
        setShowDriverModal(false);
      } catch (error) {
        console.log("Error", error);
      }
    }
  };

  const handleDriverImageUpload = async (e) => {
    e.preventDefault();

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    formData.append("driver_id", selectedDriver.profile);

    console.log("Driver image uploaded", formData);

    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axios.post(
        "/api/driver-profiles/upload/",
        formData,
        config
      );

      setDriverImage(data.image_url);
      console.log(data, "Uploaded driver photo");
    } catch (error) {
      console.log("Error", error);
    }
  };

  useEffect(() => {
    if (selectedDriver && selectedDriver.image) {
      setDriverImage(`${BASE_URL}${selectedDriver.image}`);
      console.log("Driver image", driverImage);
    } else {
      setDriverImage(driverImagePlaceholder);
    }
  }, [selectedDriver]);

  const btnClassEdit = cn("input-div", {
    "input-div_active": editDriverProfileMode,
  });

  return (
    <>
      {/* <AddDriverHeaderComponent
        setShowDriverModal={setShowDriverModal}
        editDriverProfileMode={editDriverProfileMode}
        selectedDriver={selectedDriver}
      /> */}
      <div>
        <div className="driver-details">
          <form
            onSubmit={(e) =>
              submitDriverProfile(e, selectedDriver, editDriverProfileMode)
            }
          >
            <div className="driver-details__content">
              <div className="driver-details__content-block">
                <div className="driver-details__content-row-block">
                  <label className="driver-details__content-row-block-title">
                    Фото водія
                  </label>
                  {editDriverProfileMode ? (
                    <div className="driver-details__content-row-block-photo">
                      <img src={driverImage} alt="driver" />
                      <input
                        type="file"
                        id="driver-image"
                        label="Завантажити фото"
                        className="driver-details__content-row-block-upload"
                        onChange={handleDriverImageUpload}
                      />
                    </div>
                  ) : (
                    <div className="driver-details__content-row-block-photo">
                      <img src={driverImage} alt="driver" />
                    </div>
                  )}
                </div>
              </div>
              <div className="driver-details__content-block">
                <div className="driver-details__content-row-block driver-details__content-row-block_data">
                  <div className="driver-details__content-row-block_data-row">
                    <div className="driver-details__content-row-block_data-col">
                      <label
                        htmlFor="first_name"
                        className="driver-details__content-row-block-title"
                      >
                        Ім'я
                      </label>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            required
                            type="first_name"
                            id="first_name"
                            placeholder="Введіть ім'я"
                            value={firstName || ""}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        ) : (
                          <span>{selectedDriver.first_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="driver-details__content-row-block_data-col">
                      <label
                        htmlFor="last_name"
                        className="driver-details__content-row-block-title"
                      >
                        Прізвище
                      </label>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            required
                            type="last_name"
                            id="last_name"
                            placeholder="Введіть прізвище"
                            value={lastName || ""}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        ) : (
                          <span>{selectedDriver.last_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="driver-details__content-row-block_data-row">
                    <div className="driver-details__content-row-block_data-col">
                      <label
                        htmlFor="last_name"
                        className="driver-details__content-row-block-title"
                      >
                        По батькові
                      </label>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            // required
                            type="last_name"
                            id="last_name"
                            placeholder="Введіть по батькові"
                            value={middleName || ""}
                            onChange={(e) => setMiddleName(e.target.value)}
                          />
                        ) : (
                          <span>{selectedDriver.middle_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="driver-details__content-row-block driver-details__content-row-block_data">
                  <div className="driver-details__content-row-block_data-row">
                    <div className="driver-details__content-row-block_data-col">
                      <label
                        htmlFor="email"
                        className="driver-details__content-row-block-title"
                      >
                        Email
                      </label>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            required
                            type="email"
                            id="email"
                            placeholder="Введіть email"
                            value={email || ""}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        ) : (
                          <span>{selectedDriver.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="driver-details__content-row-block_data-col">
                      <label
                        htmlFor="phone"
                        className="driver-details__content-row-block-title"
                      >
                        Phone
                      </label>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            required
                            type="phone"
                            id="phone"
                            placeholder="Введіть телефон"
                            value={phone || ""}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        ) : (
                          <span>{selectedDriver.phone_number}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="driver-details__content-row-block_data-col">
                    <label
                      htmlFor="password"
                      className="driver-details__content-row-block-title"
                    >
                      Посвідчення водія
                    </label>
                    <div className="driver-details__form-row">
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            className="driver-details__cargo-form-container__form-input"
                            type="text"
                            id="text"
                            placeholder="Серія"
                            value={licenseSeries || ""}
                            onChange={(e) => setLicenseSeries(e.target.value)}
                          />
                        ) : (
                          <span>{selectedDriver.license_series}</span>
                        )}
                      </div>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            className="driver-details__cargo-form-container__form-input"
                            type="number"
                            id="number"
                            placeholder="Номер"
                            value={licenseNumber || ""}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                          />
                        ) : (
                          <span>{selectedDriver.license_number}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="driver-details__content-row-block driver-details__content-row-block_data">
                  <div className="driver-details__content-row-block_data-row">
                    <div className="driver-details__content-row-block_data-col">
                      <label
                        htmlFor="date"
                        className="driver-details__content-row-block-title"
                      >
                        Дата народження
                      </label>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            className="driver-details__cargo-form-container__form-input"
                            type="date"
                            id="date"
                            placeholder="Дата народження"
                            value={birthday || ""}
                            onChange={(e) => setBirthday(e.target.value)}
                          />
                        ) : (
                          <span>
                            {selectedDriver.birth_date &&
                              transformDateFormat(selectedDriver.birth_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="driver-details__content-row-block_data-col">
                      <label
                        htmlFor="date"
                        className="driver-details__content-row-block-title"
                      >
                        Початок роботи
                      </label>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            className="driver-details__content-row-block-upload"
                            type="date"
                            id="date"
                            placeholder="Дата початку роботи"
                            value={workStart || ""}
                            onChange={(e) => setWorkStart(e.target.value)}
                          />
                        ) : (
                          <span>
                            {selectedDriver.work_start &&
                              transformDateFormat(selectedDriver.work_start)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="driver-details__content-row-block_data-col">
                      <label
                        htmlFor="date"
                        className="driver-details__content-row-block-title"
                      >
                        Дата звільнення
                      </label>
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            // required
                            className="driver-details__content-row-block-upload"
                            type="date"
                            id="date"
                            placeholder="Дата звільнення"
                            value={workEnd || ""}
                            onChange={(e) => setWorkEnd(e.target.value)}
                          />
                        ) : (
                          <span>
                            {selectedDriver.work_end &&
                              transformDateFormat(selectedDriver.work_end)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="driver-details__content-row-block_data-col">
                    <label
                      htmlFor="password"
                      className="driver-details__content-row-block-title"
                    >
                      Посада водія
                    </label>
                    <div className="driver-details__form-row">
                      <div className={btnClassEdit}>
                        {editDriverProfileMode ? (
                          <input
                            className="driver-details__cargo-form-container__form-input"
                            type="text"
                            id="text"
                            placeholder="Введіть назву посади водія"
                            value={position || ""}
                            onChange={(e) => setPosition(e.target.value)}
                          />
                        ) : (
                          <span>{selectedDriver.position}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="driver-details__content-block"> */}
              {/* </div> */}
            </div>
            <AddDriverFooterComponent
              setShowDriverModal={setShowDriverModal}
              setSelectedDriver={setSelectedDriver}
              setEditDriverProfileMode={setEditDriverProfileMode}
            />
          </form>
        </div>
      </div>
    </>
  );
};

export default EditDriverComponent;
