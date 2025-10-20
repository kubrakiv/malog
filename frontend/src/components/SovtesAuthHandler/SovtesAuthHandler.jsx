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

          // Check onboarding status
          const onboardingResponse = await fetch("/api/onboarding/status/", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          let onboardingData = {
            needs_onboarding: true,
            is_new_client: true,
            completed_steps: [],
            planner_tutorial_shown: false,
          };

          if (onboardingResponse.ok) {
            onboardingData = await onboardingResponse.json();
            console.log("Onboarding status:", onboardingData);
          }

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
            // Onboarding data
            needs_onboarding: onboardingData.needs_onboarding,
            is_new_client: onboardingData.is_new_client,
            completed_steps: onboardingData.completed_steps,
            planner_tutorial_shown: onboardingData.planner_tutorial_shown,
          };

          console.log("Created userInfo object with backend data:", userInfo);

          // Dispatch login success to update Redux state
          dispatch({ type: USER_LOGIN_SUCCESS, payload: userInfo });

          // Store in localStorage
          localStorage.setItem("userInfo", JSON.stringify(userInfo));

          // Clean URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          // Smart routing based on user status
          if (newUser === "true" || onboardingData.needs_onboarding) {
            console.log(
              "New user or needs onboarding, redirecting to onboarding wizard..."
            );
            // Navigate to onboarding for new users or users without essential data
            navigate("/onboarding", { replace: true });
          } else {
            console.log(
              "Existing user with complete setup, redirecting to planner..."
            );
            // Existing users with trucks and drivers go straight to planner
            navigate("/planner", { replace: true });
          }
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
