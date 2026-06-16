import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { listUsers, deleteUser } from "../../actions/userActions";
import "./UserListPage.scss";
import PasswordResetModal from "../../components/PasswordResetModal/PasswordResetModal";
// import MessageComponent from "../../components/MessageComponent/MessageComponent";
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

  const userList = useSelector((state) => state.userList);
  const { loading, users, error } = userList;

  console.log("USERS LIST", users);

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

  const handleRowDoubleClick = (e, user) => {
    e.stopPropagation();
    console.log("double click for user");
    // setShowPointModal(true);
    // setSelectedPoint(point);
  };

  const handleEditModeButton = (e, user) => {
    e.stopPropagation();
    navigate(`/user/${user.id}/edit`);
  };

  const handleDeleteUser = async (e, userId) => {
    e.stopPropagation();
    if (window.confirm("Ви впевнені, що хочете видалити користувача?")) {
      dispatch(deleteUser(userId));
    }
  };

  const handleAddUserButton = (e) => {
    e.stopPropagation();
    console.log("Add user button clicked");
    navigate("/user/add");
  };

  const handleResetPassword = async (e, user) => {
    e.stopPropagation();

    if (!window.confirm(`Reset password for ${user.email || user.username}?`)) {
      return;
    }

    try {
      setResettingUserId(user.id);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `/api/users/${user.id}/reset-password/`,
        {},
        config,
      );

      toast.success(`Password reset for ${data.username}`, {
        position: "top-right",
      });
      setPasswordModalData({
        username: data.username,
        password: data.temporary_password,
      });
      dispatch(listUsers());
    } catch (resetError) {
      const detail =
        resetError.response?.data?.detail ||
        resetError.response?.data?.error ||
        resetError.message;
      toast.error(detail, {
        position: "top-right",
      });
    } finally {
      setResettingUserId(null);
    }
  };

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
          <div>
            <p className="user-list-page__eyebrow">Команда клієнта</p>
            <h2 className="user-list-page__title">Співробітники компанії</h2>
            <p className="user-list-page__subtitle">
              Перегляд та керування користувачами вашого тенанта в одному місці.
            </p>
          </div>
          <div className="user-list-page__actions">
            <div className="user-list-page__count-chip">
              {users?.length ?? 0} користувачів
            </div>
            <button
              className="user-list-page__add-user-btn"
              title="Додати користувача"
              type="button"
              onClick={handleAddUserButton}
            >
              <FaPlus />
              <span>Додати користувача</span>
            </button>
          </div>
        </div>

        <div className="user-list-page__table-card">
          <div className="table-container user-list-page__table-wrap">
            <table className="points-table user-list-page__table">
              <thead className="points-table__header">
                <tr className="points-table__head-row">
                  <th className="points-table__head-th">ID</th>
                  <th className="points-table__head-th">First Name</th>
                  <th className="points-table__head-th">Last Name</th>
                  <th className="points-table__head-th">Phone</th>
                  <th className="points-table__head-th">Email</th>
                  <th className="points-table__head-th">Role</th>
                  <th className="points-table__head-th">Is Admin</th>
                  <th className="points-table__head-th">Actions</th>
                </tr>
              </thead>
              <tbody data-link="row" className="points-table__body">
                {users &&
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="points-table__body-row"
                      onDoubleClick={(e) => handleRowDoubleClick(e, user)}
                    >
                      <td className="points-table__body-td">{user.id}</td>
                      <td className="points-table__body-td">
                        {user.first_name}
                      </td>
                      <td className="points-table__body-td">
                        {user.last_name}
                      </td>
                      <td className="points-table__body-td">
                        {user.phone_number}
                      </td>
                      <td className="points-table__body-td">{user.email}</td>
                      <td className="points-table__body-td">{user.role}</td>
                      <td className="points-table__body-td">
                        {user.is_admin ? (
                          <FaCheck className="user-list-page__admin-icon user-list-page__admin-icon--yes" />
                        ) : (
                          <FaCheck className="user-list-page__admin-icon user-list-page__admin-icon--no" />
                        )}
                      </td>

                      <td className="points-table__body-td user-list-page__action-cell">
                        <button
                          title="Edit user"
                          className="points-table__btn points-table__btn_edit user-list-page__action-btn"
                          type="button"
                          onClick={(e) => handleEditModeButton(e, user)}
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          title="Delete user"
                          className="points-table__btn points-table__btn_delete user-list-page__action-btn"
                          type="button"
                          onClick={(e) => handleDeleteUser(e, user.id)}
                        >
                          <FaRegTrashAlt />
                        </button>
                        {isSystemAdmin && (
                          <button
                            title="Reset password"
                            className="points-table__btn points-table__btn_reset user-list-page__action-btn"
                            type="button"
                            onClick={(e) => handleResetPassword(e, user)}
                            disabled={resettingUserId === user.id}
                          >
                            <FaKey />
                          </button>
                        )}
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
