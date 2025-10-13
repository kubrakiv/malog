import { SET_TASK_TYPE_LIST_DATA } from "../actions/taskTypeActions";

const initialState = {
    taskTypes: {
        data: [],
        loading: false,
        error: null,
    },
};

export const taskTypeReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_TASK_TYPE_LIST_DATA:
            return {
                ...state,
                taskTypes: {
                    ...state.taskTypes,
                    ...action.data,
                    loading: action.data.loading,
                    error: action.data.error,
                },
            };

        default:
            return state;
    }
};
