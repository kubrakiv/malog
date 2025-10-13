import React from "react";
import { Card } from "react-bootstrap";

function Truck({ task }) {
    return (
        <div>
            <Card className="my-3 p-3 rounded">
                <Card.Text as="div">{task.truck}</Card.Text>
            </Card>
        </div>
    );
}

export default Truck;
