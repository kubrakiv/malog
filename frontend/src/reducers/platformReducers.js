import { SET_PLATFORM_LIST_DATA } from "../actions/platformActions";

const initialState = {
    platforms: {
        data: [],
    },
};

export const platformReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_PLATFORM_LIST_DATA:
            return {
                ...state,
                platforms: {
                    ...state.platforms,
                    ...action.data,
                },
            };

        default:
            return state;
    }
};

export const setPlatformListData = (data) => ({
    type: SET_PLATFORM_LIST_DATA,
    data,
});
