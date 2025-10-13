import { SET_TASK_LIST_DATA } from "../actions/taskActions";

const initialState = {
    tasks: {
        data: [],
    },
};

export const taskReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_TASK_LIST_DATA:
            return {
                ...state,
                tasks: {
                    ...state.tasks,
                    data: action.data,
                },
            };

        default:
            return state;
    }
};

export const setTaskListData = (data) => ({
    type: SET_TASK_LIST_DATA,
    data,
});
