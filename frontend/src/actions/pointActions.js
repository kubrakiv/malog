import axios from "axios";

export const SET_POINT_LIST_DATA = "SET_POINT_LIST_DATA";
export const SET_POINT_DETAILS_DATA = "SET_POINT_DETAILS_DATA";

export const listPoints = () => async (dispatch) => {
    try {
        dispatch(setPointListData({ loading: true, error: null }));

        const { data } = await axios.get("/api/points/");
        dispatch(setPointListData({ data }));
    } catch (error) {
        dispatch(setPointListData({ error: error.message }));
    } finally {
        dispatch(setPointListData({ loading: false }));
    }
};

export const setPointListData = (data) => ({
    type: SET_POINT_LIST_DATA,
    data,
});

export const setPointDetailsData = (point) => ({
    type: SET_POINT_DETAILS_DATA,
    data: point,
});
