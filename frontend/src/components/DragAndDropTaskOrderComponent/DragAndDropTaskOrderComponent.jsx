import React from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import TaskOrder from "../Task/TaskOrder";

const DragAndDropTaskOrderComponent = ({
    tasks,
    handleShowPointOnMap,
    handleEditModeTask,
    handleDeleteTask,
    setTasks,
}) => {
    const handleDragDrop = (results) => {
        console.log("Result: ", results);

        const { source, destination, type } = results;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        )
            return;

        if (type === "tasks") {
            const reorderedTasks = [...tasks];

            const sourceIndex = source.index;
            const destinationIndex = destination.index;

            const [removedTask] = reorderedTasks.splice(sourceIndex, 1);
            reorderedTasks.splice(destinationIndex, 0, removedTask);
            setTasks(reorderedTasks);
        }
    };

    return (
        <>
            <DragDropContext onDragEnd={handleDragDrop}>
                <Droppable droppableId="tasks" type="tasks">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {tasks &&
                                tasks.map((task, index) => (
                                    <Draggable
                                        key={task.id}
                                        draggableId={String(task.id)}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                {...provided.dragHandleProps}
                                                {...provided.draggableProps}
                                                ref={provided.innerRef}
                                            >
                                                {/* <h3>{task.title}</h3> */}
                                                <TaskOrder
                                                    task={task}
                                                    handleShowPointOnMap={
                                                        handleShowPointOnMap
                                                    }
                                                    handleEditModeTask={
                                                        handleEditModeTask
                                                    }
                                                    handleDeleteTask={
                                                        handleDeleteTask
                                                    }
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </>
    );
};

export default DragAndDropTaskOrderComponent;
