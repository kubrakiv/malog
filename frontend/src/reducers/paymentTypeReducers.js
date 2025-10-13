import { SET_PAYMENT_TYPE_LIST_DATA } from "../actions/paymentTypeActions";

const initialState = {
    paymentTypes: {
        data: [],
    },
};

export const paymentTypeReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_PAYMENT_TYPE_LIST_DATA: {
            return {
                ...state,
                paymentTypes: {
                    ...state.paymentTypes,
                    ...action.data,
                },
            };
        }
        default:
            return state;
    }
};

export const setPaymentTypeListData = (data) => ({
    type: SET_PAYMENT_TYPE_LIST_DATA,
    data,
});
