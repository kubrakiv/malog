import React from "react";
import { Card } from "react-bootstrap";

function Date({ task }) {
    return (
        <Card className="my-3 p-3 rounded">
            <Card.Text as="div">{task.start_date_time}</Card.Text>
        </Card>
    );
}

export default Date;
