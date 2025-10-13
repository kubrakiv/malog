import React from "react";
import "./style.scss";

const RouteInfoComponent = ({ routeInfo, truckToNext }) => {
  if (!routeInfo.distance) return null;

  return (
    <div className="route-info-panel">
      <h3>Route Info</h3>
      <div className="route-summary">
        <strong>Empty:</strong> {routeInfo.emptyDistance} km
      </div>
      <div className="route-summary">
        <strong>Distance:</strong> {routeInfo.distance} km
      </div>
      <div className="route-summary">
        <strong>Estimated Time:</strong> {routeInfo.duration} h
      </div>
      {truckToNext && (
        <div className="route-summary">
          <strong>From Truck:</strong> {truckToNext.distance} km (
          {truckToNext.duration} min)
        </div>
      )}

      {routeInfo.countryData?.length > 0 && (
        <>
          <h4>Route Details by Country</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Distance (km)</th>
                  <th>Tolls (EUR)</th>
                  <th>Tolls/EUR km</th>
                </tr>
              </thead>
              <tbody>
                {routeInfo.countryData.map((country, index) => {
                  const distance = parseFloat(country.distance);
                  const tolls = parseFloat(country.toll);
                  const tollsPerKm =
                    distance > 0 ? (tolls / distance).toFixed(3) : "0.000";

                  return (
                    <tr key={index}>
                      <td>{country.country}</td>
                      <td>{country.distance}</td>
                      <td>{country.toll}</td>
                      <td>{tollsPerKm}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td>
                    <strong>{routeInfo.distance}</strong>
                  </td>
                  <td>
                    <strong>{routeInfo.tollData?.totalEUR || "0.00"}</strong>
                  </td>
                  <td>
                    <strong>
                      {routeInfo.distance && routeInfo.tollData?.totalEUR
                        ? (
                            parseFloat(routeInfo.tollData.totalEUR) /
                            parseFloat(routeInfo.distance)
                          ).toFixed(3)
                        : "0.000"}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default RouteInfoComponent;
