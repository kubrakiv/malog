export const getTaskTitle = (task) => {
    if (!task) return "";
    if (task.point_details === null) return "";

    return (
        task.point_details?.country_short?.toUpperCase() +
        "-" +
        task.point_details?.postal_code +
        " " +
        task.point_details?.city
    );
};
