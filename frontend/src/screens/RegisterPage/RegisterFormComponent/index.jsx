import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import MessageComponent from "../../../components/MessageComponent/MessageComponent";
import { getCsrfToken } from "../../../utils/getCsrfToken";
import { register } from "../../../actions/userActions";
import { listDrivers } from "../../../actions/driverActions";
import "./style.scss";
import SelectComponent from "../../../globalComponents/SelectComponent";
import InputComponent from "../../../globalComponents/InputComponent";
import { transformSelectOptions } from "../../../utils/transformers";
import { listRoles } from "../../../features/roles/roleOperations";
import { selectRoles } from "../../../features/roles/roleSelectors";

const REGISTER_CONSTANTS = {
  ROLE: "role",
  FIRST_NAME: "first_name",
  LAST_NAME: "last_name",
  EMAIL: "email",
  PHONE: "phone_number",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirm_password",
};

const {
  ROLE,
  FIRST_NAME,
  LAST_NAME,
  EMAIL,
  PHONE,
  PASSWORD,
  CONFIRM_PASSWORD,
} = REGISTER_CONSTANTS;

const RegisterFormComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState("");
  // const [isRegistered, setIsRegistered] = useState(false);

  const [registerFields, setRegisterFields] = useState(
    Object.values(REGISTER_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {})
  );
  console.log("Register fields", registerFields);

  const redirect = "/login";

  const userRegister = useSelector((state) => state.userRegister);
  const { success, error } = userRegister;

  const roles = useSelector(selectRoles);

  const roleTypesOptions = transformSelectOptions(roles, "name");
  console.log("Role types options", roleTypesOptions);

  useEffect(() => {
    dispatch(listRoles());
  }, [dispatch]);

  console.log("Roles", roles);

  const handleRegisterDataChange = (e) => {
    const { name, value } = e.target;
    setRegisterFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    console.log("Selected Role:", e.target.value);
    setSelectedRole(e.target.value);
  };

  const handleCloseRegistration = () => {
    setMessage("");
    dispatch(listDrivers());
    navigate("/drivers");
    console.log("Close registration");
  };

  const submitHandler = (e) => {
    e.preventDefault();
    let userData = {};
    let isValid = true;
    setMessage("");

    // Check if all necessary fields are filled
    Object.keys(registerFields).forEach((key) => {
      if (!registerFields[key] && key !== CONFIRM_PASSWORD && key !== ROLE) {
        isValid = false;
        setMessage(`Поле ${key} не може бути порожнім!`);
      }
    });
    console.log("Register fields filled", registerFields);

    // Check if password and confirmPassword match
    if (registerFields[PASSWORD] !== registerFields[CONFIRM_PASSWORD]) {
      setMessage("Паролі не співпадають!");
      isValid = false;
    }

    // Check if selected role is not empty
    if (isValid) {
      Object.keys(registerFields).forEach((key) => {
        if (key !== CONFIRM_PASSWORD) {
          userData[key] = registerFields[key];
        }

        userData[ROLE] = selectedRole;
      });
      console.log("User data:", userData);
      dispatch(register(userData));
      dispatch(listDrivers());
      handleCloseRegistration();
    }
  };

  useEffect(() => {
    if (success) {
      setMessage("Користувач зареєстрований успішно!");
      setIsRegistered(true);
    } else if (error) {
      setMessage("Помилка реєстрації користувача!");
    }
  }, [success, error]);

  const formFields = [
    {
      id: FIRST_NAME,
      placeholder: "Введіть ім'я",
      type: "text",
      title: "Ім'я",
      label: "Ім'я",
    },
    {
      id: LAST_NAME,
      placeholder: "Введіть прізвище",
      type: "text",
      title: "Прізвище",
      label: "Прізвище",
    },
    {
      id: EMAIL,
      placeholder: "Введіть email",
      type: "email",
      title: "Email",
      label: "Email",
    },
    {
      id: PHONE,
      placeholder: "Введіть телефон",
      type: "tel",
      title: "Телефон",
      label: "Телефон",
    },
    {
      id: PASSWORD,
      placeholder: "Введіть пароль",
      type: "password",
      title: "Пароль",
      label: "Пароль",
    },
    {
      id: CONFIRM_PASSWORD,
      placeholder: "Повторіть пароль",
      type: "password",
      title: "Повторний пароль",
      label: "Повторний пароль",
    },
  ];

  return (
    <>
      <div className="add-order-details" style={{ margin: "auto" }}>
        <div className="login-form-container">
          <form className="login-form" onSubmit={(e) => submitHandler(e)}>
            <h3>Реєстрація</h3>
            {message && (
              <MessageComponent color={"red"}>{message}</MessageComponent>
            )}

            <div className="order-details__form-row">
              {formFields.map((item) => {
                const { id, placeholder, type, title, label } = item;
                return (
                  <div key={id} className="order-details__form-row_item">
                    <InputComponent
                      required
                      label={label}
                      id={id}
                      name={id}
                      type={type}
                      title={title}
                      placeholder={placeholder}
                      value={registerFields[id]}
                      onChange={(e) => handleRegisterDataChange(e)}
                    />
                  </div>
                );
              })}
            </div>
            <div className="login-form__input-group">
              <SelectComponent
                title="Роль користувача"
                id="role"
                name="role"
                value={selectedRole}
                onChange={handleRoleChange}
                options={roleTypesOptions}
              />
            </div>
            {location.pathname === "/drivers/add" && (
              <button
                className="form-footer-btn form-footer-btn_save"
                type="submit"
              >
                Зареєструвати водія
              </button>
            )}
            {location.pathname === "/register" && (
              <button
                className="form-footer-btn form-footer-btn_save"
                type="submit"
              >
                Зареєструватися
              </button>
            )}
          </form>
          {location.pathname === "/register" && (
            <div className="login-form__input-group">
              <label />
              <div>
                Вже зареєструвалися?{" "}
                <Link to={redirect ? `/login?redirect=${redirect}` : "/login"}>
                  Увійти
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegisterFormComponent;
