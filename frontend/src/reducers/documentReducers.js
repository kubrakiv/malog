import {
  SET_DOCUMENT_LIST_DATA,
  SET_DOCUMENT_UPLOAD_DATA,
  SET_EDIT_MODE_DOCUMENT,
  RESET_DOCUMENT_LIST_DATA,
} from "../actions/documentActions";

const initialState = {
  documents: {
    data: [],
  },
  upload: {
    data: {},
  },
  editMode: false,
};

export const documentReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_DOCUMENT_LIST_DATA:
      return {
        ...state,
        documents: {
          ...state.documents,
          data: action.data,
        },
      };

    case RESET_DOCUMENT_LIST_DATA:
      return {
        ...state,
        documents: {
          ...state.documents,
          data: [],
        },
      };

    case SET_DOCUMENT_UPLOAD_DATA:
      return {
        ...state,
        upload: {
          ...state.upload,
          data: action.data,
        },
      };

    case SET_EDIT_MODE_DOCUMENT:
      return { ...state, editMode: action.payload };

    default:
      return state;
  }
};

export const setDocumentListData = (data) => ({
  type: SET_DOCUMENT_LIST_DATA,
  data,
});

export const resetDocumentListData = () => ({
  type: RESET_DOCUMENT_LIST_DATA,
});

export const setDocumentUploadData = (data) => ({
  type: SET_DOCUMENT_UPLOAD_DATA,
  data,
});

export const setEditModeDocument = (payload) => ({
  type: SET_EDIT_MODE_DOCUMENT,
  payload,
});
