import React from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import "./DragAndDropComponent.scss";
import TaskListComponent from "./TaskListComponent/TaskListComponent";

const DragAndDropComponent = ({ orders, handleOrders }) => {
    const handleDragDrop = (results) => {
        console.log("Result: ", results);
        const { source, destination, type } = results;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        )
            return;

        if (type === "group") {
            const reorderedOrders = [...orders];

            const sourceIndex = source.index;
            const destinationIndex = destination.index;

            const [removedOrder] = reorderedOrders.splice(sourceIndex, 1);
            reorderedOrders.splice(destinationIndex, 0, removedOrder);

            handleOrders(reorderedOrders);
        }

        console.log("Source: ", source);
        console.log("Destination: ", destination);

        console.log("Orders: ", orders);

        const taskSourceIndex = source.index;
        const taskDestinationIndex = destination.index;

        const orderSourceIndex = orders.findIndex(
            (order) => order.id === source.droppableId
        );

        const orderDestinationIndex = orders.findIndex(
            (order) => order.id === destination.droppableId
        );

        // const newSourceTasks = [...(orders[orderSourceIndex]?.tasks ?? [])];
        const newSourceTasks = [...orders[orderSourceIndex].tasks];

        console.log("New source tasks: ", newSourceTasks);
        const newDestinationTasks =
            source.droppableId !== destination.droppableId
                ? [...orders[orderDestinationIndex].tasks]
                : newSourceTasks;

        const [deletedTask] = newSourceTasks.splice(taskSourceIndex, 1);
        newDestinationTasks.splice(taskDestinationIndex, 0, deletedTask);

        const newOrders = [...orders];

        newOrders[orderSourceIndex] = {
            ...orders[orderSourceIndex],
            tasks: newSourceTasks,
        };

        newOrders[orderDestinationIndex] = {
            ...orders[orderDestinationIndex],
            tasks: newDestinationTasks,
        };

        handleOrders(newOrders);
    };

    return (
        <div>
            <div className="layout__wrapper">
                <div className="card">
                    <DragDropContext onDragEnd={handleDragDrop}>
                        <div className="dnd-header">
                            <h1>Orders List</h1>
                        </div>

                        <Droppable
                            droppableId="ROOT"
                            type="group"
                            className="dnd-body"
                        >
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {orders.slice(0, 3).map((order, index) => (
                                        <Draggable
                                            key={order.id}
                                            draggableId={String(order.id)}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <div
                                                    // className="tasks"
                                                    {...provided.dragHandleProps}
                                                    {...provided.draggableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    <TaskListComponent
                                                        id={order.id}
                                                        number={order.number}
                                                        customer={
                                                            order.customer
                                                        }
                                                        tasks={order.tasks}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </div>
        </div>
    );
};

export default DragAndDropComponent;

{
    /* <DragAndDropTaskOrderComponent
                                            tasks={tasks}
                                            setTasks={setTasks}
                                            handleShowPointOnMap={
                                                handleShowPointOnMap
                                            }
                                            handleEditModeTask={
                                                handleEditModeTask
                                            }
                                            handleDeleteTask={handleDeleteTask}
                                        /> */
}
