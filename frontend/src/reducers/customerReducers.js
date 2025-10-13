import {
    SET_CUSTOMER_LIST_DATA,
    SET_CUSTOMER_DETAILS_DATA,
    SET_EDIT_MODE_CUSTOMER,
    SET_MANAGER_LIST_DATA,
    SET_MANAGER_DETAILS_DATA,
} from "../actions/customerActions";

const initialState = {
    customers: {
        data: [],
        loading: false,
        error: null,
    },
    customer: {
        data: {},
    },
    managers: {
        data: [],
    },
    manager: {
        data: {},
    },
    editMode: false,
};

export const customerReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_CUSTOMER_LIST_DATA:
            return {
                ...state,
                customers: {
                    ...state.customers,
                    ...action.data,
                    loading: action.data.loading,
                    error: action.data.error,
                },
            };

        case SET_CUSTOMER_DETAILS_DATA:
            return {
                ...state,
                customer: {
                    ...state.customer,
                    ...action.data,
                },
            };

        case SET_EDIT_MODE_CUSTOMER:
            return { ...state, editMode: action.payload };

        case SET_MANAGER_LIST_DATA:
            return {
                ...state,
                managers: {
                    ...state.managers,
                    ...action.data,
                },
            };

        case SET_MANAGER_DETAILS_DATA:
            return {
                ...state,
                manager: {
                    ...state.manager,
                    ...action.data,
                },
            };

        default:
            return state;
    }
};
