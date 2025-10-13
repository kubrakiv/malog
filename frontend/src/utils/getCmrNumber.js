export const getCmrNumber = (documents) => {
  const cmr = documents?.find((doc) => doc.file_type === "CMR");
  if (!cmr) return null; // Return null if no CMR document is found

  const fileName = cmr.file_name;
  const parts = fileName.split("_"); // Split the string by underscores
  if (parts.length < 2) return null; // Ensure there is a numeric part to extract
  const numberWithExtension = parts[1]; // Get the second part (e.g., "111089.jpg")
  return numberWithExtension.split(".")[0]; // Remove the file extension (e.g., ".jpg")
};
