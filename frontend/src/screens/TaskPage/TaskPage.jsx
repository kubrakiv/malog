import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskPage.scss";

function TaskScreen() {
    const { id } = useParams();

    const [task, setTask] = useState([]);

    useEffect(() => {
        async function fetchTask() {
            const { data } = await axios.get(`/api/tasks/${id}/`);
            setTask(data);
        }
        fetchTask();
    }, [id]);

    const date_str = String(task.start_date_time).split("T")[0];

    return (
        <div className="task-container">
            <button className="task-container__return-button button">
                <Link to="/tasks">Return</Link>
            </button>
            <div className="task-container__task-title">{date_str}</div>
            <div className="task-container__task-title">{task.title}</div>
            <div className="task-container__task-title">{task.type}</div>
            <div className="task-container__task-title">{task.truck}</div>
            <div className="task-container__task-title">{task.driver}</div>
        </div>
    );
}

export default TaskScreen;
