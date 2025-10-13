import React from "react";
import "./MessageComponent.scss";

const MessageComponent = ({ color, children }) => {
    console.log(color, "this is color");
    return (
        <div
            className={`message-container ${
                color && "message-container_" + color
            }`}
        >
            <div className="message">{children}</div>
        </div>
    );
};

export default MessageComponent;
