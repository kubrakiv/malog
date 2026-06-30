import ManageTrailerComponent from "../ManageTrailerComponent";

const TrailerCardComponent = ({ trailer, onCloseModal }) => {
  return (
    <ManageTrailerComponent
      onEditMode={true}
      initialTrailerData={trailer}
      onCloseModal={onCloseModal}
    />
  );
};

export default TrailerCardComponent;
