import axios from "axios";
import {
  setDocumentListData,
  setDocumentUploadData,
} from "../reducers/documentReducers";

export const SET_DOCUMENT_LIST_DATA = "SET_DOCUMENT_LIST_DATA";
export const SET_DOCUMENT_UPLOAD_DATA = "SET_DOCUMENT_UPLOAD_DATA";
export const SET_EDIT_MODE_DOCUMENT = "SET_EDIT_MODE_DOCUMENT";
export const RESET_DOCUMENT_LIST_DATA = "RESET_DOCUMENT_LIST_DATA";

export const listDocuments = (orderId) => async (dispatch) => {
  try {
    const { data } = await axios.get(`/api/documents/${orderId}/order/`);
    dispatch(setDocumentListData(data));
  } catch (error) {
    console.error(error);
  }
};

export const uploadDocument = (documentData) => async (dispatch) => {
  try {
    const { data } = await axios.post(`/api/documents/upload/`, documentData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    dispatch(setDocumentUploadData(data));
  } catch (error) {
    console.error(error);
  }
};
