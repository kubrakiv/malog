import React, { useEffect } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";

const TaskListComponent = ({ id, number, customer, tasks }) => {
    useEffect(() => {
        console.log("Tasks: ", tasks);
    }, [tasks]);

    return (
        <Droppable droppableId={String(id)}>
            {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    <div className="order-container">
                        <h3>
                            {id}: {number}- {customer}
                        </h3>
                    </div>
                    <div className="tasks-container">
                        {tasks.map((task, index) => (
                            <Draggable
                                key={task.id}
                                draggableId={String(task.id)}
                                index={index}
                            >
                                {(provided) => (
                                    <div
                                        className="task-container"
                                        {...provided.dragHandleProps}
                                        {...provided.draggableProps}
                                        ref={provided.innerRef}
                                    >
                                        <h3>
                                            {task.id}: {task.title}
                                        </h3>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                    </div>
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default TaskListComponent;
