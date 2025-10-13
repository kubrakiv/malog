import { useDispatch, useSelector } from "react-redux";
import { setEditModeDocument } from "../../../reducers/documentReducers";

import "./UploadDocumentsFooterComponent.scss";

const UploadDocumentsFooterComponent = () => {
  const dispatch = useDispatch();
  const editModeDocument = useSelector((state) => state.documentsInfo.editMode);

  const handleCloseDocumentModal = (e) => {
    e.preventDefault();

    dispatch(setEditModeDocument(!editModeDocument));
  };

  return (
    <>
      <div className="upload-documents__footer">
        <button
          title="Close Window"
          className="upload-documents__footer-btn upload-documents__footer-btn_close"
          onClick={(e) => handleCloseDocumentModal(e)}
        >
          Закрити
        </button>
      </div>
    </>
  );
};

export default UploadDocumentsFooterComponent;
