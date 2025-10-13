import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { getCsrfToken } from "../../../utils/getCsrfToken";
import { transformSelectOptions } from "../../../utils/transformers";

import UploadDocumentsFooterComponent from "../UploadDocumentsFooterComponent/UploadDocumentsFooterComponent";
import SelectComponent from "../../../globalComponents/SelectComponent";
import { listDocuments } from "../../../actions/documentActions";

const AddDocumentsForm = () => {
  const dispatch = useDispatch();
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const [files, setFiles] = useState([]);
  const [fileTypesOptions, setFileTypesOptions] = useState([]);

  const [selectedFileType, setSelectedFileType] = useState("");

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setFiles(files);

    console.log("Uploaded files:", files);
  };

  useEffect(() => {
    (async () => {
      const { data } = await axios.get("/api/file-types/");
      setFileTypesOptions(transformSelectOptions(data, "name"));
    })();
  }, []);

  // useEffect(() => {
  //   getCsrfToken();
  // }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("order_id", order.id);
    formData.append("file_type", selectedFileType);

    console.log("Order number", order.order_number);
    console.log("File type", selectedFileType);

    files.forEach((file) => {
      formData.append(`files`, file);
    });

    try {
      const response = await axios.post("/api/documents/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response.data, "this is uploaded files");
      dispatch(listDocuments(order.id));
    } catch (error) {
      console.log("Error", error);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="upload-documents-form">
      <div className="upload-documents__content">
        <div className="upload-documents__content-block">
          <div className="upload-documents__row">
            <div className="upload-documents__content-row-block">
              <div className="upload-documents__row-block">
                <SelectComponent
                  label="Вибрати тип документу"
                  title="Тип документу"
                  id="file types"
                  name="file types"
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  options={fileTypesOptions}
                  widthStyle="select-input-width-auto"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="upload-documents__content-block">
          <div className="upload-documents__row">
            <div className="upload-documents__content-row-block">
              <div className="upload-documents__row-block">
                <label className="upload-documents__form-title">
                  Завантажити файли
                </label>
                <input
                  className="upload-documents__form-file"
                  label="Завантажити файли"
                  type="file"
                  name="files"
                  id="formFileMultiple"
                  multiple
                  onChange={handleFiles}
                />
              </div>
              <button
                type="button"
                title="Upload documents"
                className="upload-documents__footer-btn upload-documents__footer-btn_edit"
                onClick={handleFormSubmit}
              >
                Додати
              </button>
            </div>
          </div>
        </div>
      </div>
      <UploadDocumentsFooterComponent />
    </form>
  );
};

export default AddDocumentsForm;
