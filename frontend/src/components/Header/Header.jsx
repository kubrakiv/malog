import { useContext, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaUser, FaCrown, FaLock, FaChevronDown } from "react-icons/fa";
import { logout } from "../../actions/userActions";
import { searchOrderByNumber } from "../../features/orders/ordersOperations";
import { useSubscription } from "../../hooks/useSubscription";
import { useConfirm } from "../../globalComponents/ConfirmModal/useConfirm";

import SearchOrderComponent from "../../components/SearchOrderComponent";
import OpenContext from "../OpenContext";

import "./Header.scss";

function Header() {
  const { toggleSidebar } = useContext(OpenContext);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [orderNumber, setOrderNumber] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const { subscription, loading: subscriptionLoading } = useSubscription();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logoutHandler = async () => {
    const confirmExit = await confirm("Ви впевнені, що хочете вийти?");
    if (!confirmExit) {
      return;
    }

    if (confirmExit) {
      dispatch(logout());
      navigate("/");
    }
  };

  const handleSearch = async () => {
    if (!orderNumber.trim()) return;

    try {
      const resultAction = await dispatch(
        searchOrderByNumber(orderNumber),
      ).unwrap();
      console.log("Result", resultAction);
      const order = resultAction;
      navigate(`/orders/${order.id}`);
      setOrderNumber("");
    } catch {
      alert("Something went wrong");
    }
  };

  return (
    <header className="header">
      <div className="header-navbar">
        <div className="top-section-header" onClick={toggleSidebar}>
          <FaBars />
        </div>
        <div className="header-navbar__title">
          <Link to="/planner" className="logo-link">
            <span className="logo-text">TMS SOVTES</span>
            <span className="logo-hover-effect"></span>
          </Link>
        </div>

        <div className="header-navbar__search-wrapper">
          <SearchOrderComponent
            orderNumber={orderNumber}
            setOrderNumber={setOrderNumber}
            onSearch={handleSearch}
          />
        </div>

        <div className="header-right-section">
          {/* Subscription Info Bar */}
          {userInfo && !subscriptionLoading && (
            <div className="header-subscription-info">
              {subscription ? (
                <div className="subscription-mini-bar">
                  <FaCrown className="crown-icon" />
                  <span className="plan-name">
                    {subscription.plan_details.display_name}
                  </span>
                  {subscription.days_remaining !== undefined && (
                    <span className="days-remaining">
                      {subscription.days_remaining > 0 ? (
                        <>
                          {subscription.days_remaining}{" "}
                          {subscription.days_remaining === 1
                            ? "день"
                            : subscription.days_remaining < 5
                              ? "дні"
                              : "днів"}
                        </>
                      ) : (
                        "Закінчено"
                      )}
                    </span>
                  )}
                </div>
              ) : (
                <div className="no-subscription-mini-bar">
                  <FaLock className="lock-icon" />
                  <span className="no-plan-message">No Plan</span>
                </div>
              )}
            </div>
          )}

          {userInfo ? (
            <div className="header-navbar__user-dropdown" ref={dropdownRef}>
              <div
                className="user-info"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <FaUser className="user-icon" />
                <span className="user-name">{userInfo.full_name}</span>
                <FaChevronDown
                  className={`dropdown-arrow ${dropdownOpen ? "open" : ""}`}
                />
              </div>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FaUser />
                    Профіль
                  </Link>
                  {userInfo.role === "client_admin" && (
                    <Link
                      to="/subscriptions"
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FaCrown />
                      Підписки
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout" onClick={logoutHandler}>
                    Вийти
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="header-navbar__login">
              <Link to="/login">LOGIN</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
