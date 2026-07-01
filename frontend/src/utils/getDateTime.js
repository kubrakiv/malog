export const getDateTime = (date, time) => {
    if (!date) return new Date(8640000000000000);
    return new Date(`${date}T${time || "00:00:00"}`);
};
