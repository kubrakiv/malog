import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";

// Define RootState as the type for the entire Redux state, inferred from the rootReducer
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch; // Add this line for dispatch typing

const userInfoFromStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo") as string)
  : null;

const initialState = {
  userLogin: { userInfo: userInfoFromStorage },
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
});

export default store;
