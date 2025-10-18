import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { USER_LOGIN_SUCCESS } from "../../actions/userActions";

const SovtesAuthHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleSovtesAuth = async () => {
      const urlParams = new URLSearchParams(location.search);
      const accessToken = urlParams.get("access_token");
      const refreshToken = urlParams.get("refresh_token");
      const isSovtesAuth = urlParams.get("sovtes_auth");
      const newUser = urlParams.get("new_user");

      console.log("SovtesAuthHandler - URL params:", {
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
        refreshToken: refreshToken
          ? `${refreshToken.substring(0, 20)}...`
          : null,
        isSovtesAuth,
        newUser,
      });

      if (isSovtesAuth && accessToken && refreshToken) {
        console.log("Processing Sovtes authentication...");

        try {
          // First, fetch the complete user profile from the backend
          const response = await fetch("/api/users/profile/", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.status}`);
          }

          const userProfile = await response.json();
          console.log("Fetched user profile:", userProfile);

          // Create userInfo object with complete backend data
          const userInfo = {
            id: userProfile.id,
            username: userProfile.username,
            email: userProfile.email,
            token: accessToken,
            refresh_token: refreshToken,
            is_sovtes_user: true,
            // Use actual backend data
            role: userProfile.role || "driver",
            first_name: userProfile.first_name || "",
            last_name: userProfile.last_name || "",
            full_name: userProfile.full_name || "",
            client: userProfile.client || null,
            is_admin: userProfile.is_admin || false,
            is_staff: userProfile.is_staff || false,
            is_superuser: userProfile.is_superuser || false,
            phone_number: userProfile.phone_number || "",
          };

          console.log("Created userInfo object with backend data:", userInfo);

          // Dispatch login success to update Redux state
          dispatch({ type: USER_LOGIN_SUCCESS, payload: userInfo });

          // Store in localStorage
          localStorage.setItem("userInfo", JSON.stringify(userInfo));

          // Clean URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          // Show success message for new users
          if (newUser === "true") {
            console.log("Welcome new Sovtes user!");
            // You could show a welcome toast or modal here
          }

          console.log(
            "Sovtes authentication successful, redirecting to main..."
          );
          // Navigate to main page
          navigate("/main", { replace: true });
        } catch (error) {
          console.error("Error processing Sovtes authentication:", error);
          // If there's an error, redirect to login with error message
          navigate("/login?error=Authentication failed", { replace: true });
        }
      }
    };

    handleSovtesAuth();
  }, [location, navigate, dispatch]);

  // This component doesn't render anything
  return null;
};

export default SovtesAuthHandler;
