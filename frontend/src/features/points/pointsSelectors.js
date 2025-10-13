export const selectPoints = (state) => state.pointsInfo.points.data;

export const selectPointDetails = (state) => state.pointsInfo.point.data;

export const selectSelectedPoint = (state) =>
  state.pointsInfo.selectedPoint.data;

export const selectEditModePoint = (state) => state.pointsInfo.editModePoint;
