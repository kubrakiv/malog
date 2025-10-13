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

const {
  ROLE,
  FIRST_NAME,
  LAST_NAME,
  EMAIL,
  PHONE,
  PASSWORD,
  CONFIRM_PASSWORD,
} = USER_CONSTANTS;

const AddUserFormComponent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form data state using the same structure as RegisterFormComponent
  const [userFields, setUserFields] = useState(
    Object.values(USER_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {})
  );

  const userRegister = useSelector((state) => state.userRegister);
  const { success, error } = userRegister;

  const roles = useSelector(selectRoles);
  const roleTypesOptions = transformSelectOptions(roles, "name");

  useEffect(() => {
    dispatch(listRoles());
  }, [dispatch]);

  const handleUserDataChange = (e) => {
    const { name, value } = e.target;
    setUserFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    console.log("Selected Role:", e.target.value);
    setSelectedRole(e.target.value);
  };

  const validateForm = () => {
    let isValid = true;
    setMessage("");

    // Check if all necessary fields are filled
    Object.keys(userFields).forEach((key) => {
      if (!userFields[key] && key !== CONFIRM_PASSWORD && key !== ROLE) {
        isValid = false;
        setMessage(`Field ${key} cannot be empty!`);
      }
    });

    // Check if password and confirmPassword match
    if (userFields[PASSWORD] !== userFields[CONFIRM_PASSWORD]) {
      setMessage("Passwords do not match!");
      isValid = false;
    }

    // Check if selected role is not empty
    if (!selectedRole) {
      setMessage("Please select a role!");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let userData = {};

      // Build userData object like in RegisterFormComponent
      Object.keys(userFields).forEach((key) => {
        if (key !== CONFIRM_PASSWORD) {
          userData[key] = userFields[key];
        }
      });
      userData[ROLE] = selectedRole;

      console.log("User data:", userData);
      await dispatch(adminCreateUser(userData));

      // If we reach here, registration was successful
      toast.success("User created successfully!", {
        position: "top-right",
        duration: 4000,
      });
      navigate("/admin/userlist");
    } catch (error) {
      console.error("User creation error:", error);
      toast.error("Failed to create user. Please try again.", {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      setMessage("User registered successfully!");
      toast.success("User created successfully!", {
        position: "top-right",
        duration: 4000,
      });
      navigate("/admin/userlist");
    } else if (error) {
      setMessage("Error registering user!");
      toast.error("Failed to create user. Please try again.", {
        position: "top-right",
      });
    }
  }, [success, error, navigate]);

  const formFields = [
    {
      id: FIRST_NAME,
      placeholder: "Enter first name",
      type: "text",
      title: "First Name",
      label: "First Name",
    },
    {
      id: LAST_NAME,
      placeholder: "Enter last name",
      type: "text",
      title: "Last Name",
      label: "Last Name",
    },
    {
      id: EMAIL,
      placeholder: "Enter email",
      type: "email",
      title: "Email",
      label: "Email",
    },
    {
      id: PHONE,
      placeholder: "Enter phone number",
      type: "tel",
      title: "Phone Number",
      label: "Phone Number",
    },
    {
      id: PASSWORD,
      placeholder: "Enter password",
      type: "password",
      title: "Password",
      label: "Password",
    },
    {
      id: CONFIRM_PASSWORD,
      placeholder: "Confirm password",
      type: "password",
      title: "Confirm Password",
      label: "Confirm Password",
    },
  ];

  return (
    <div className="add-user-form">
      <div className="add-user-form__header">
        <h2>Add New User</h2>
        <p>Create a new user account for your organization</p>
      </div>

      {message && <MessageComponent color={"red"}>{message}</MessageComponent>}

      <form onSubmit={handleSubmit} className="add-user-form__form">
        <div className="form-row">
          {formFields.map((item) => {
            const { id, placeholder, type, title, label } = item;
            return (
              <div key={id} className="form-group">
                <InputComponent
                  required
                  label={label}
                  id={id}
                  name={id}
                  type={type}
                  title={title}
                  placeholder={placeholder}
                  value={userFields[id]}
                  onChange={(e) => handleUserDataChange(e)}
                />
              </div>
            );
          })}
        </div>

        <div className="form-row">
          <div className="form-group">
            <SelectComponent
              title="User Role"
              id="role"
              name="role"
              value={selectedRole}
              onChange={handleRoleChange}
              options={roleTypesOptions}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin/userlist")}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Creating User..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUserFormComponent;
