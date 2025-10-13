import React from "react";
import { Marker } from "@react-google-maps/api";
import { FaMapMarkerAlt, FaMapPin } from "react-icons/fa";

const CurrentLocationMarker = ({ position }) => {
    return (
        <div>
            <Marker
                position={position}
                icon={<FaMapMarkerAlt />}
                // icon={{
                //     url: FaMapPin,
                //     scaledSize: new window.google.maps.Size(30, 30),
                // }}
            />
        </div>
    );
};

export default CurrentLocationMarker;
