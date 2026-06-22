import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { listUsers, deleteUser } from "../../actions/userActions";
import "./UserListPage.scss";
import PasswordResetModal from "../../components/PasswordResetModal/PasswordResetModal";
import SearchComponent from "../../globalComponents/SearchComponent";
import {
  FaCheck,
  FaPencilAlt,
  FaRegTrashAlt,
  FaPlus,
  FaKey,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const UserListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [resettingUserId, setResettingUserId] = useState(null);
  const [passwordModalData, setPasswordModalData] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const userList = useSelector((state) => state.userList);
  const { users } = userList;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userDelete = useSelector((state) => state.userDelete);
  const { success: successDelete } = userDelete;
  const isSystemAdmin = userInfo?.role === "system_admin";

  useEffect(() => {
    if (userInfo && userInfo.is_admin) {
      dispatch(listUsers());
    } else {
      navigate("/login");
    }
  }, [dispatch, navigate, userInfo, successDelete]);

  const handleCheckboxChange = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleEditSelected = () => {
    if (selectedUsers.length !== 1) return;
    navigate(`/user/${selectedUsers[0]}/edit`);
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm("Ви впевнені, що хочете видалити вибраних користувачів?")) return;
    for (const userId of selectedUsers) {
      await dispatch(deleteUser(userId));
    }
    setSelectedUsers([]);
  };

  const handleAddUserButton = () => {
    navigate("/user/add");
  };

  const handleResetPassword = async () => {
    if (selectedUsers.length !== 1) return;
    const user = (users ?? []).find((u) => u.id === selectedUsers[0]);
    if (!user) return;

    if (!window.confirm(`Скинути пароль для ${user.email || user.username}?`)) return;

    try {
      setResettingUserId(user.id);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(`/api/users/${user.id}/reset-password/`, {}, config);
      toast.success(`Пароль скинуто для ${data.username}`);
      setPasswordModalData({ username: data.username, password: data.temporary_password });
      dispatch(listUsers());
    } catch (resetError) {
      const detail =
        resetError.response?.data?.detail ||
        resetError.response?.data?.error ||
        resetError.message;
      toast.error(detail || "Не вдалося скинути пароль");
    } finally {
      setResettingUserId(null);
    }
  };

  const filteredUsers = (users ?? []).filter((u) => {
    const q = search.toLowerCase();
    return (
      q === "" ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone_number?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <PasswordResetModal
        isOpen={Boolean(passwordModalData)}
        username={passwordModalData?.username}
        password={passwordModalData?.password}
        onClose={() => setPasswordModalData(null)}
      />
      <div className="user-list-page">
        <div className="user-list-page__hero">
          <h2 className="user-list-page__title">
            Співробітники
            <span
              className="user-list-page__info-badge"
              data-tooltip="Перегляд та керування користувачами вашого тенанта в одному місці."
            >
              i
            </span>
          </h2>
          <div className="user-list-page__actions">
            <span className="user-list-page__count-chip">
              {users?.length ?? 0} користувачів
            </span>
          </div>
        </div>

        <div className="fleet-toolbar">
          <div className="fleet-toolbar__search">
            <SearchComponent
              search={search}
              setSearch={setSearch}
              placeholder="пошук користувачів"
            />
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--add"
              title="Додати користувача"
              onClick={handleAddUserButton}
              type="button"
            >
              <FaPlus />
            </button>
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--delete"
              title="Видалити вибраних"
              onClick={handleDeleteSelected}
              disabled={selectedUsers.length === 0}
              type="button"
            >
              <FaRegTrashAlt />
            </button>
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--edit"
              title="Редагувати користувача"
              onClick={handleEditSelected}
              disabled={selectedUsers.length !== 1}
              type="button"
            >
              <FaPencilAlt />
            </button>
            {isSystemAdmin && (
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--reset"
                title="Скинути пароль"
                onClick={handleResetPassword}
                disabled={selectedUsers.length !== 1 || resettingUserId !== null}
                type="button"
              >
                <FaKey />
              </button>
            )}
          </div>
          {selectedUsers.length > 0 && (
            <span className="fleet-toolbar__badge">{selectedUsers.length} обрано</span>
          )}
        </div>

        <div className="user-list-page__table-card">
          <div className="table-container user-list-page__table-wrap">
            <table className="users-table">
              <thead className="users-table__header">
                <tr className="users-table__head-row">
                  <th className="users-table__head-th">#</th>
                  <th className="users-table__head-th">Ім'я</th>
                  <th className="users-table__head-th">Прізвище</th>
                  <th className="users-table__head-th">Телефон</th>
                  <th className="users-table__head-th">Email</th>
                  <th className="users-table__head-th">Роль</th>
                  <th className="users-table__head-th">Адмін</th>
                  <th className="users-table__head-th"></th>
                </tr>
              </thead>
              <tbody className="users-table__body">
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`users-table__body-row${selectedUsers.includes(user.id) ? " users-table__body-row--active" : ""}`}
                    onClick={() => handleCheckboxChange(user.id)}
                  >
                    <td className="users-table__body-td">{index + 1}</td>
                    <td className="users-table__body-td">{user.first_name}</td>
                    <td className="users-table__body-td">{user.last_name}</td>
                    <td className="users-table__body-td">{user.phone_number}</td>
                    <td className="users-table__body-td">{user.email}</td>
                    <td className="users-table__body-td">
                      <span className="users-table__role-badge">{user.role}</span>
                    </td>
                    <td className="users-table__body-td">
                      {user.is_admin ? (
                        <FaCheck className="users-table__admin-icon--yes" />
                      ) : (
                        <span className="users-table__admin-icon--no">—</span>
                      )}
                    </td>
                    <td className="users-table__body-td">
                      <input
                        type="checkbox"
                        className="users-table__checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleCheckboxChange(user.id)}
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

export default UserListPage;
