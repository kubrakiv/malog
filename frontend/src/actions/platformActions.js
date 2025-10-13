import axios from "axios";
import { setPlatformListData } from "../reducers/platformReducers";

export const SET_PLATFORM_LIST_DATA = "SET_PLATFORM_LIST_DATA";

export const listPlatforms = () => async (dispatch) => {
    try {
        dispatch(setPlatformListData({ loading: true, error: null }));

        const { data } = await axios.get("/api/platforms/");
        dispatch(setPlatformListData({ data, loading: false }));
    } catch (error) {
        dispatch(setPlatformListData({ error: error.message, loading: false }));
    }
};
