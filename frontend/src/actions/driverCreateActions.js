import { addDriver } from "../features/drivers/driversSlice";
import { listDrivers } from "../features/drivers/driversOperations";

/**
 * Create a driver using the user registration system
 * @param {Object} userData - The driver user data
 * @returns {Function} - Redux thunk function
 */
export const createDriverAndUpdate = (userData) => async (dispatch) => {
  try {
    // First, register the user/driver with the system
    const response = await fetch("/api/users/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Error creating driver:", responseData);
      throw new Error(responseData.detail || "Failed to create driver");
    }

    // Add the driver to our Redux state
    dispatch(addDriver(responseData));

    // Refresh the driver list
    dispatch(listDrivers());

    return { success: true, data: responseData };
  } catch (error) {
    console.error("Error in createDriverAndUpdate:", error);
    return { success: false, error: error.message };
  }
};
