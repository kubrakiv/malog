import axios from "axios";
import { setTaskListData } from "../reducers/taskReducers";

export const SET_TASK_LIST_DATA = "SET_TASK_LIST_DATA";

export const listTasks = () => async (dispatch) => {
    try {
        const { data } = await axios.get("/api/tasks/");
        dispatch(setTaskListData(data));
    } catch (error) {
        console.error(error);
    }
};
