import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function TaskList() {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        axios.get('/api/tasks')
            .then(res => setTasks(res.data))
            .catch(console.error);
    }, []);

    return (
        <div className="container mt-4">
            <h1>Tasks</h1>
            <Link to="/new">New Task</Link>
            <ul>
                {tasks.map(t => (
                    <li key={t.id}>
                        {t.title} — {t.status} (<Link to={`/edit/${t.id}`}>Edit</Link>)
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TaskList;
