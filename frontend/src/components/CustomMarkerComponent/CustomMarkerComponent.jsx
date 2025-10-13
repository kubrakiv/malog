import React from "react";
import { OverlayView } from "@react-google-maps/api";
import { FaMapMarkerAlt } from "react-icons/fa";

const CustomMarker = ({ position, type, title }) => {
    const getPointColor = (type) => {
        return type === "Завантаження" ? "green" : "red";
    };

    return (
        <OverlayView
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div
                style={{
                    position: "absolute",
                    transform: "translate(-50%, -100%)",
                }}
                title={title}
            >
                <FaMapMarkerAlt
                    style={{ fontSize: "24px", color: getPointColor(type) }}
                />
            </div>
        </OverlayView>
    );
};

export default CustomMarker;
