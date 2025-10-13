import axios from "axios";
import { setPaymentTypeListData } from "../reducers/paymentTypeReducers";

export const SET_PAYMENT_TYPE_LIST_DATA = "SET_PAYMENT_TYPE_LIST_DATA";

export const listPaymentTypes = () => async (dispatch) => {
    try {
        dispatch(setPaymentTypeListData({ loading: true, error: null }));

        const { data } = await axios.get("/api/payment-types/");
        dispatch(setPaymentTypeListData({ data, loading: false }));
    } catch (error) {
        dispatch(
            setPaymentTypeListData({ error: error.message, loading: false })
        );
    }
};
