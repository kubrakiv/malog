import axios from "axios";

export const SET_TASK_TYPE_LIST_DATA = "SET_TASK_TYPE_LIST_DATA";

export const listTaskTypes = () => async (dispatch) => {
    try {
        dispatch(setTaskTypeListData({ loading: true, error: null }));

        const { data } = await axios.get("/api/task-types/");
        dispatch(setTaskTypeListData({ data }));
    } catch (error) {
        dispatch(setTaskTypeListData({ error: error.message }));
    }
};

export const setTaskTypeListData = (data) => ({
    type: SET_TASK_TYPE_LIST_DATA,
    data,
});
