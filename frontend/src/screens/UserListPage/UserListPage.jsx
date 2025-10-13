import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { listUsers, deleteUser } from "../../actions/userActions";
import "./UserListPage.scss";
// import MessageComponent from "../../components/MessageComponent/MessageComponent";
import { FaCheck, FaPencilAlt, FaRegTrashAlt, FaPlus } from "react-icons/fa";

const UserListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userList = useSelector((state) => state.userList);
  const { loading, users, error } = userList;

  console.log("USERS LIST", users);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userDelete = useSelector((state) => state.userDelete);
  const { success: successDelete } = userDelete;

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
    navigate(`/admin/user/${user.id}/edit`);
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
    navigate("/admin/user/add");
  };

  return (
    <>
      <div className="points-container">
        <div className="points-header-block">
          <h2 className="table__name">Співробітники компанії</h2>
          <div className="points-header-block__buttons-container">
            <button
              className="points-header-block__add-user-btn"
              title="Додати користувача"
              onClick={handleAddUserButton}
            >
              <FaPlus />
            </button>
          </div>
        </div>
        <div className="table-container">
          <table className="points-table">
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
                    <td className="points-table__body-td">{user.first_name}</td>
                    <td className="points-table__body-td">{user.last_name}</td>
                    <td className="points-table__body-td">
                      {user.phone_number}
                    </td>
                    <td className="points-table__body-td">{user.email}</td>
                    <td className="points-table__body-td">{user.role}</td>
                    <td className="points-table__body-td">
                      {user.is_admin ? (
                        <FaCheck
                          style={{
                            color: "green",
                          }}
                        />
                      ) : (
                        <FaCheck
                          style={{
                            color: "red",
                          }}
                        />
                      )}
                    </td>

                    <td className="points-table__body-td">
                      <button
                        title="Edit user"
                        className="points-table__btn points-table__btn_edit"
                        onClick={(e) => handleEditModeButton(e, user)}
                      >
                        <FaPencilAlt />
                      </button>
                      <button
                        title="Delete user"
                        className="points-table__btn points-table__btn_delete"
                        onClick={(e) => handleDeleteUser(e, user.id)}
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

export default UserListPage;
