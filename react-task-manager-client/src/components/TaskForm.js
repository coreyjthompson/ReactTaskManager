import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function TaskForm({ existingTask }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [task, setTask] = useState({
        title: '', description: '', dueDate: '', status: 'To Do'
    });

    useEffect(() => {
        if (id) {
            axios.get(`/api/tasks/${id}`)
                .then(res => setTask(res.data))
                .catch(console.error);
        }
    }, [id]);

    const handleChange = e => {
        const { name, value } = e.target;
        setTask(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = e => {
        e.preventDefault();
        const request = id
            ? axios.put(`/api/tasks/${id}`, { ...task, id })
            : axios.post('/api/tasks', task);

        request.then(() => navigate('/'))
            .catch(console.error);
    };

    return (
        <div className="container mt-4">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input name="title" value={task.title} onChange={handleChange} placeholder="Title" className="form-control"  required />
                </div>
                <div className="mb-3">
                    <textarea name="description" value={task.description} onChange={handleChange} placeholder="Description" className="form-control"/>
                </div>
                <div className="mb-3">
                    <input type="date" name="dueDate" value={task.dueDate?.split('T')[0] || ''} onChange={handleChange} className="form-control" />
                </div>
                <div className="mb-3">
                    <select name="status" value={task.status} onChange={handleChange} className="form-select">
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                    </select>
                </div>
                <div className="mb-3">
                    <button type="submit" className="btn btn-primary">{id ? 'Update' : 'Create'}</button>
                </div>                
            </form>
        </div>
    );
}

export default TaskForm;
