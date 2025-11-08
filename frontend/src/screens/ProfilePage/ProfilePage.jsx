import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserDetails,
  updateUserProfile,
  USER_UPDATE_PROFILE_RESET,
} from "../../actions/userActions";
import toast from "react-hot-toast";
import InputComponent from "../../globalComponents/InputComponent";
import "./ProfilePage.scss";

const ProfilePage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userDetails = useSelector((state) => state.userDetails);
  const { loading, user, error } = userDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { success } = userUpdateProfile;

  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    } else {
      if (!user || !user.email || success || userInfo.id !== user.id) {
        dispatch({ type: USER_UPDATE_PROFILE_RESET });
        dispatch(getUserDetails("profile"));
      } else {
        setFirstName(user.first_name);
        setLastName(user.last_name);
        setEmail(user.email);
        setPhone(user.phone_number);
        setRole(user.role);
      }
    }
  }, [navigate, userInfo, dispatch, user, success]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error("Паролі не співпадають!", {
        position: "top-right",
      });
      return;
    }

    const userData = {
      id: userInfo.id,
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      email,
      ...(password && { password }), // Only include password if provided
    };

    dispatch(updateUserProfile(userData));
    toast.success("Профіль успішно оновлено!", {
      position: "top-right",
      duration: 3000,
    });
    setMessage("");
  };

  const getRole = (role) => {
    switch (role) {
      case "admin":
        return "адміністратора";
      case "driver":
        return "водія";
      case "logist":
        return "логіста";
      default:
        return null;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>Профіль користувача</h2>
        <p className="profile-role">Роль: {getRole(role)}</p>
      </div>

      <form onSubmit={submitHandler}>
        <div className="profile-section">
          <h3>Особиста інформація</h3>
          <div className="form-row">
            <div className="form-group">
              <InputComponent
                label="Ім'я *"
                name="firstName"
                type="text"
                placeholder="Введіть ім'я"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <InputComponent
                label="Прізвище *"
                name="lastName"
                type="text"
                placeholder="Введіть прізвище"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Контактна інформація</h3>
          <div className="form-row">
            <div className="form-group">
              <InputComponent
                label="Email *"
                name="email"
                type="email"
                placeholder="Введіть email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <InputComponent
                label="Телефон"
                name="phone"
                type="tel"
                placeholder="Введіть телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Зміна паролю</h3>
          <p className="section-description">
            Залиште поля пустими, якщо не хочете змінювати пароль
          </p>
          <div className="form-row">
            <div className="form-group">
              <InputComponent
                label="Новий пароль"
                name="password"
                type="password"
                placeholder="Введіть новий пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <InputComponent
                label="Підтвердіть пароль"
                name="confirmPassword"
                type="password"
                placeholder="Підтвердіть новий пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {loading ? "Оновлення..." : "Оновити профіль"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
