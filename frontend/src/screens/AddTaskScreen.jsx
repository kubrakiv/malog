import React, { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import axios from "axios";

function AddTaskScreen() {
    const [title, setTitle] = useState("");
    const [datetime, setDatetime] = useState("");
    const [truck, setTruck] = useState("");
    const [driver, setDriver] = useState("");

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const data = {
            title: title,
            start_date_time: datetime,
            truck: truck,
            driver: driver,
        };

        try {
            const response = await axios.post("/api/tasks/create/", data);
            console.log("Task created successfully:", response.data);
        } catch (error) {
            console.error("Error creating task:", error.message);
        }
    };

    return (
        <Container style={{ maxWidth: "600px" }}>
            <h1>Task creation</h1>
            <Form onSubmit={handleFormSubmit}>
                <Form.Group controlId="title">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                        required
                        type="title"
                        placeholder="Enter task title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    ></Form.Control>
                </Form.Group>

                <Form.Group controlId="date">
                    <Form.Label>Start Date And Time</Form.Label>
                    <Form.Control
                        required
                        type="datetime-local"
                        placeholder="Enter task start date and time"
                        value={datetime}
                        onChange={(e) => setDatetime(e.target.value)}
                    ></Form.Control>
                </Form.Group>

                <Form.Group controlId="truck">
                    <Form.Label>Truck</Form.Label>
                    <Form.Control
                        required
                        type="text"
                        placeholder="Enter task truck"
                        value={truck}
                        onChange={(e) => setTruck(e.target.value)}
                    ></Form.Control>
                </Form.Group>

                <Form.Group controlId="driver">
                    <Form.Label>Driver</Form.Label>
                    <Form.Control
                        required
                        type="text"
                        placeholder="Enter task driver"
                        value={driver}
                        onChange={(e) => setDriver(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Button type="submit" variant="primary" className="mt-3">
                    ADD TASK
                </Button>
            </Form>
        </Container>
    );
}

export default AddTaskScreen;
