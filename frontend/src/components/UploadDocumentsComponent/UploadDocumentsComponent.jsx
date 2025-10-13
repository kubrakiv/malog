import { useSelector, useDispatch } from "react-redux";
import { setEditModeDocument } from "../../reducers/documentReducers";

import UploadDocumentsHeaderComponent from "./UploadDocumentsHeaderComponent/UploadDocumentsHeaderComponent";
import DocumentsTableComponent from "./DocumentsTableComponent";
import AddDocumentsForm from "./AddDocumentsForm";
import GenericModalComponent from "../../globalComponents/GenericModalComponent";

import "./UploadDocumentsComponent.scss";

const UploadDocumentsComponent = () => {
  const dispatch = useDispatch();

  const editModeDocument = useSelector((state) => state.documentsInfo.editMode);

  const handleCloseDocumentModal = () => {
    dispatch(setEditModeDocument(!editModeDocument));
  };

  return (
    <>
      <GenericModalComponent
        show={editModeDocument}
        onClose={handleCloseDocumentModal}
        content={
          <div className="upload-documents-container">
            <div className="upload-documents">
              <UploadDocumentsHeaderComponent />
              <DocumentsTableComponent />
              <AddDocumentsForm />
            </div>
          </div>
        }
      />
    </>
  );
};

export default UploadDocumentsComponent;
