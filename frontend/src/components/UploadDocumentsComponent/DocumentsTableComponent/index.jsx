import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { listDocuments } from "../../../actions/documentActions";
import { FaFolderOpen, FaTrash } from "react-icons/fa";
import { useConfirm } from "../../../globalComponents/ConfirmModal/useConfirm";

const buildDocumentUrl = (fileUrl, baseUrl) => {
  if (!fileUrl) {
    return "";
  }

  const normalizedFileUrl = fileUrl.replace(/^(https?)\/\//i, "$1://");

  if (/^https?:\/\//i.test(normalizedFileUrl)) {
    return normalizedFileUrl;
  }

  const normalizedBaseUrl = (baseUrl || "").replace(/\/+$/, "");
  const normalizedPath = normalizedFileUrl.startsWith("/")
    ? normalizedFileUrl
    : `/${normalizedFileUrl}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
};

const DocumentsTableComponent = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const documents = useSelector(
    (state) => state.documentsInfo.documents.data.documents
  );
  const editModeDocument = useSelector((state) => state.documentsInfo.editMode);

  const BASE_URL = import.meta.env.REACT_APP_API_BASE_URL;
  // const BASE_URL = import.meta.env.REACT_APP_PROXY;

  useEffect(() => {
    if (editModeDocument) {
      dispatch(listDocuments(order.id));
    }
  }, [order, dispatch, editModeDocument]);

  const openDocument = async (documentId) => {
    try {
      const response = await axios.get(`/api/documents/${documentId}/`);
      const documentUrl = buildDocumentUrl(response.data.file, BASE_URL);

      if (documentUrl) {
        window.open(documentUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Error opening document:", error);
    }
  };

  const deleteDocument = async (documentId) => {
    const isConfirmed = await confirm(
      "Ви впевнені, що хочете видалити документ?"
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await axios.delete(`/api/documents/delete/${documentId}/`);
      dispatch(listDocuments(order.id));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return (
    documents && (
      <div className="upload-documents__content-block">
        <div className="upload-documents__row">
          <div className="upload-documents__content-row-block_table">
            <div className="documents-container">
              <table className="documents-table">
                <thead className="documents-table__header">
                  <tr className="documents-table__head-row">
                    <th className="documents-table__head-th">ID</th>
                    <th className="documents-table__head-th">Тип документу</th>
                    <th className="documents-table__head-th">Файл</th>
                    <th className="documents-table__head-th">Дата</th>
                    <th className="documents-table__head-th">Дії</th>
                  </tr>
                </thead>
                <tbody className="documents-table__body">
                  {documents.map((document) => {
                    // Parse uploaded_at string into a Date object
                    const uploadedAtDate = new Date(document.uploaded_at);

                    // Extract date and time components
                    const formattedDate = uploadedAtDate
                      .toISOString()
                      .slice(0, 10);
                    const formattedTime = uploadedAtDate.toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );
                    return (
                      <tr
                        key={document.id}
                        className="documents-table__body-row"
                      >
                        <td className="documents-table__body-td">
                          {document.id}
                        </td>
                        <td className="documents-table__body-td">
                          {document.file_type}
                        </td>

                        <td className="documents-table__body-td documents-table__body-td-wrap">
                          {document.file_name}
                        </td>
                        <td className="documents-table__body-td">
                          {formattedDate} {formattedTime}
                        </td>
                        <td className="documents-table__body-td">
                          <button
                            className="order-details__action-show-documents-btn"
                            title="Відкрити документ"
                            onClick={() => openDocument(document.id)}
                          >
                            <FaFolderOpen />
                          </button>
                          <button
                            className="order-details__action-delete-document-btn"
                            title="Видалити документ"
                            onClick={() => deleteDocument(document.id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default DocumentsTableComponent;
