import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import InputComponent from "../../globalComponents/InputComponent";
import SelectComponent from "../../globalComponents/SelectComponent";
import MessageComponent from "../../components/MessageComponent/MessageComponent";
import { adminCreateUser } from "../../actions/userActions";
import { transformSelectOptions } from "../../utils/transformers";
import { listRoles } from "../../features/roles/roleOperations";
import { selectRoles } from "../../features/roles/roleSelectors";

import "./AddUserFormComponent.scss";

const USER_CONSTANTS = {
  ROLE: "role",
  FIRST_NAME: "first_name",
  LAST_NAME: "last_name",
  EMAIL: "email",
  PHONE: "phone_number",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirm_password",
};

const { ROLE, FIRST_NAME, LAST_NAME, EMAIL, PHONE, PASSWORD, CONFIRM_PASSWORD } = USER_CONSTANTS;

const FIELD_LABELS = {
  [FIRST_NAME]: "Ім'я",
  [LAST_NAME]: "Прізвище",
  [EMAIL]: "Email",
  [PHONE]: "Телефон",
  [PASSWORD]: "Пароль",
  [CONFIRM_PASSWORD]: "Підтвердження паролю",
};

const AddUserFormComponent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [userFields, setUserFields] = useState(
    Object.values(USER_CONSTANTS).reduce((acc, key) => ({ ...acc, [key]: "" }), {}),
  );

  const userRegister = useSelector((state) => state.userRegister);
  const { success, error } = userRegister;

  const roles = useSelector(selectRoles);
  const roleTypesOptions = transformSelectOptions(roles, "name");

  useEffect(() => { dispatch(listRoles()); }, [dispatch]);

  const handleUserDataChange = (e) => {
    const { name, value } = e.target;
    setUserFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => setSelectedRole(e.target.value);

  const validateForm = () => {
    setMessage("");

    for (const key of Object.keys(userFields)) {
      if (!userFields[key] && key !== CONFIRM_PASSWORD && key !== ROLE) {
        setMessage(`Поле «${FIELD_LABELS[key] || key}» не може бути порожнім`);
        return false;
      }
    }

    if (userFields[PASSWORD] !== userFields[CONFIRM_PASSWORD]) {
      setMessage("Паролі не збігаються");
      return false;
    }

    if (!selectedRole) {
      setMessage("Оберіть роль користувача");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData = {};
      Object.keys(userFields).forEach((key) => {
        if (key !== CONFIRM_PASSWORD) userData[key] = userFields[key];
      });
      userData[ROLE] = selectedRole;

      await dispatch(adminCreateUser(userData));
      toast.success("Користувача успішно створено!", { position: "top-right", duration: 4000 });
      navigate("/userlist");
    } catch (err) {
      toast.error("Не вдалося створити користувача. Спробуйте ще раз.", { position: "top-right" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      toast.success("Користувача успішно створено!", { position: "top-right", duration: 4000 });
      navigate("/userlist");
    } else if (error) {
      setMessage("Помилка при реєстрації користувача");
      toast.error("Не вдалося створити користувача. Спробуйте ще раз.", { position: "top-right" });
    }
  }, [success, error, navigate]);

  const personalFields = [
    { id: FIRST_NAME, placeholder: "Введіть ім'я",          type: "text",     label: "Ім'я" },
    { id: LAST_NAME,  placeholder: "Введіть прізвище",       type: "text",     label: "Прізвище" },
    { id: EMAIL,      placeholder: "Введіть email",           type: "email",    label: "Email" },
    { id: PHONE,      placeholder: "Введіть номер телефону",  type: "tel",      label: "Номер телефону" },
  ];

  const accessFields = [
    { id: PASSWORD,         placeholder: "Введіть пароль",        type: "password", label: "Пароль" },
    { id: CONFIRM_PASSWORD, placeholder: "Підтвердіть пароль",    type: "password", label: "Підтвердження паролю" },
  ];

  return (
    <div className="add-user-form">
      <div className="add-user-form__header">
        <h2 className="add-user-form__title">Новий користувач</h2>
        <p className="add-user-form__subtitle">Створіть обліковий запис для вашої організації</p>
      </div>

      <form onSubmit={handleSubmit} className="add-user-form__form">
        {message && <MessageComponent color="red">{message}</MessageComponent>}

        <div className="add-user-form__section">
          <p className="add-user-form__section-label">Особисті дані</p>
          <div className="add-user-form__grid">
            {personalFields.map(({ id, placeholder, type, label }) => (
              <div key={id} className="add-user-form__field">
                <InputComponent
                  required
                  label={label}
                  id={id}
                  name={id}
                  type={type}
                  placeholder={placeholder}
                  value={userFields[id]}
                  onChange={handleUserDataChange}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="add-user-form__section">
          <p className="add-user-form__section-label">Доступ та безпека</p>
          <div className="add-user-form__grid">
            {accessFields.map(({ id, placeholder, type, label }) => (
              <div key={id} className="add-user-form__field">
                <InputComponent
                  required
                  label={label}
                  id={id}
                  name={id}
                  type={type}
                  placeholder={placeholder}
                  value={userFields[id]}
                  onChange={handleUserDataChange}
                />
              </div>
            ))}
            <div className="add-user-form__field">
              <SelectComponent
                title="Роль користувача"
                id="role"
                name="role"
                value={selectedRole}
                onChange={handleRoleChange}
                options={roleTypesOptions}
              />
            </div>
          </div>
        </div>

        <div className="add-user-form__actions">
          <button
            type="button"
            className="add-user-form__btn add-user-form__btn--cancel"
            onClick={() => navigate("/userlist")}
            disabled={isLoading}
          >
            Скасувати
          </button>
          <button
            type="submit"
            className="add-user-form__btn add-user-form__btn--submit"
            disabled={isLoading}
          >
            {isLoading ? "Створення…" : "Створити користувача"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUserFormComponent;
