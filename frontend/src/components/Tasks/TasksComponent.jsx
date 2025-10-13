import React from "react";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

function TaskComponent({ task }) {
    // Extracting date and time separately
    const hasData = task.length > 0;
    console.log(task, hasData, "this is task in a task component");
    // const dateTime = hasData ? new Date(task?.start_date_time) : null;

    if (hasData) {
        return (
            <>
                {task.map((t) => (
                    <div className="task">
                        <div className="task__time">
                            {new Date(t.start_date_time)
                                .toLocaleTimeString()
                                .substring(0, 5)}
                        </div>
                        <div className="task__title">{t?.title}</div>
                        {/* <div className="task__truck">{t?.truck}</div> */}
                    </div>
                ))}

                <Button type="button" className="btn btn-secondary">
                    +
                </Button>
            </>
        );
    }

    return (
        <div className="task">
            <>
                <Button type="button" className="btn btn-secondary">
                    +
                </Button>
            </>
        </div>
    );
}

export default TaskComponent;
