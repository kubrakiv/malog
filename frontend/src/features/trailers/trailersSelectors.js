export const selectTrailers = (state) => state.trailersInfo.trailers.data;

export const selectEditModeTrailer = (state) =>
  state.trailersInfo.editModeTrailer;

export const selectSelectedTrailer = (state) =>
  state.trailersInfo.selectedTrailer.data;

export const selectShowTrailerModal = (state) =>
  state.trailersInfo.showTrailerModal;

export const selectShowAddTrailerModal = (state) =>
  state.trailersInfo.showAddTrailerModal;
