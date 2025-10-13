export const editModeReducer = (state, action) => {
    switch (action.type) {
        case "TOGGLE_EDIT_MODE":
            return { ...state, [action.field]: !state[action.field] };
        default:
            return state;
    }
};
