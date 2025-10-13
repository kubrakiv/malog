export const transformSelectOptions = (options, label, value) => {
    return options.map((option) => ({
        label: option[label],
        value: option[value] || option[label],
    }));
};
