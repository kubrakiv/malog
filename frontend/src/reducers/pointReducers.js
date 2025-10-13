import {
    SET_POINT_LIST_DATA,
    SET_POINT_DETAILS_DATA,
} from "../actions/pointActions";

const initialState = {
    points: {
        data: [],
        loading: false,
        error: null,
    },
    point: {
        data: {},
    },
};

export const pointReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_POINT_LIST_DATA:
            return {
                ...state,
                points: {
                    ...state.points,
                    ...action.data,
                    loading: action.data.loading,
                    error: action.data.error,
                },
            };
        case SET_POINT_DETAILS_DATA:
            return {
                ...state,
                point: {
                    ...state.point,
                    data: action.data,
                },
            };

        default:
            return state;
    }
};
