import React from "react";

function TasksInOrder({ task }) {
    return (
        <>
            <div className="task-order__container" key={task.id}>
                <div className="task-order">
                    <div className="task-order__type">{task.type}</div>
                    <div className="task-order__title">{task.title}</div>
                </div>
            </div>
        </>
    );
}

export default TasksInOrder;
