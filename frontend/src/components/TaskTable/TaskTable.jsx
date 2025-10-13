import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./TaskTable.scss";

function TaskTable() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await axios.get("/api/tasks/");
      setTasks(data);
    }
    fetchTasks();
  }, []);

  const handleRowClick = (task) => {
    setSelectedTask(task);
    navigate(`/tasks/${task.id}`);
  };

  return (
    <>
      <h2 className="table__name">Таблиця завдань</h2>
      <div className="table__container">
        <table className="task-table">
          <thead className="task-table__head">
            <tr className="task-table__head-row">
              <th className="task-table__head-th">ID</th>
              <th className="task-table__head-th">Order</th>
              <th className="task-table__head-th">Title</th>
              <th className="task-table__head-th">Date</th>
              <th className="task-table__head-th">Time</th>
              <th className="task-table__head-th">Truck</th>
              <th className="task-table__head-th">Driver</th>
              <th className="task-table__head-th">Buttons</th>
            </tr>
          </thead>
          <tbody data-link="row" className="task-table__body">
            {tasks.map((task, index) => (
              <tr
                key={index}
                className="task-table__body-row"
                onClick={() => handleRowClick(task)}
              >
                <td className="task-table__body-td">{task.id}</td>
                <td className="task-table__body-td">{task.order}</td>
                <td className="task-table__body-td">{task.title}</td>
                <td className="task-table__body-td">{task.start_date}</td>
                <td className="task-table__body-td">{task.start_time}</td>
                <td className="task-table__body-td">{task.truck}</td>
                <td className="task-table__body-td">{task.driver}</td>
                <td className="task-table__body-td"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default TaskTable;
