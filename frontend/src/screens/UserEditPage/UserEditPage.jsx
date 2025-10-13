import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    getUserDetails,
    updateUser,
    USER_UPDATE_RESET,
} from "../../actions/userActions";
import "./UserEditPage.scss";
import MessageComponent from "../../components/MessageComponent/MessageComponent";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const UserEditPage = () => {
    const { id } = useParams();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState("");

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userDetails = useSelector((state) => state.userDetails);
    const { loading, error, user } = userDetails;

    const userUpdate = useSelector((state) => state.userUpdate);
    const { success: successUpdate } = userUpdate;

    useEffect(() => {
        (async () => {
            const { data } = await axios.get(`/api/roles/`);
            setRoles(data);
        })();
    }, []);

    useEffect(() => {
        if (successUpdate) {
            dispatch({ type: USER_UPDATE_RESET });
            navigate("/admin/userlist");
        } else {
            if (!user || user.id !== Number(id)) {
                dispatch(getUserDetails(Number(id)));
            } else {
                setFirstName(user.first_name);
                setLastName(user.last_name);
                setEmail(user.email);
                setPhone(user.phone_number);
                setIsAdmin(user.is_admin);
                setSelectedRole(user.role);
            }
        }
    }, [user, id, dispatch, successUpdate, navigate]);

    const submitHandler = (e) => {
        e.preventDefault();

        const data = {
            id: id,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone_number: phone,
            is_admin: isAdmin,
            role: selectedRole,
        };

        dispatch(updateUser(data));
    };

    const notify = () =>
        toast.success("Back to user list!", {
            position: "top-center",
            style: { /* color: "green", */ marginTop: "0rem" },
        });

    const goBackHandler = () => {
        navigate("/admin/userlist");
        dispatch({ type: USER_UPDATE_RESET });
        setSelectedRole(null);
        notify();
    };

    return (
        <div>
            <button className="btn button" onClick={goBackHandler}>
                Назад
            </button>
            <div className="passport-container">
                <div className="login-form-container">
                    <h3>User Edit Page</h3>
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        error && (
                            <MessageComponent color={"red"}>
                                {error}
                            </MessageComponent>
                        )
                    )}
                    <form
                        className="login-form"
                        onSubmit={(e) => submitHandler(e)}
                    >
                        <div className="login-form__input-group">
                            <label htmlFor="name">Ім'я</label>
                            <input
                                required
                                type="text"
                                id="name"
                                placeholder="Введіть ім'я"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="login-form__input-group">
                            <label htmlFor="surname">Прізвище</label>
                            <input
                                required
                                type="text"
                                id="surname"
                                placeholder="Введіть ім'я"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                        <div className="login-form__input-group">
                            <label htmlFor="email">Логін/Email</label>
                            <input
                                required
                                type="email"
                                id="email"
                                placeholder="Введіть логін/email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="login-form__input-group">
                            <label htmlFor="email">Телефон</label>
                            <input
                                required
                                type="phone"
                                id="phone"
                                placeholder="Введіть телефон"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className="login-form__input-group">
                            <label htmlFor="admin">Адмін</label>
                            <input
                                type="checkbox"
                                id="admin"
                                label="Адмін"
                                checked={isAdmin}
                                onChange={(e) => setIsAdmin(e.target.checked)}
                            />
                        </div>
                        <div className="login-form__input-group">
                            <label htmlFor="userRole">Роль користувача</label>
                            <select
                                required
                                id="userRole"
                                value={selectedRole}
                                onChange={(e) =>
                                    setSelectedRole(e.target.value)
                                }
                            >
                                {selectedRole === null && (
                                    <option value="null">Оберіть роль</option>
                                )}

                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button className="button" type="submit">
                            Оновити дані
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserEditPage;
