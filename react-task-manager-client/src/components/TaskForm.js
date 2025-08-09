// src/components/TaskForm.js
import api from '../services/api';
import React, { useEffect, useState } from 'react';
import { Button, Form, FloatingLabel } from 'react-bootstrap';

function TaskForm({ id, initialTask, onSave, onCancel }) {
    const [task, setTask] = useState({
        title: '',
        description: '',
        dueDate: '',
        status: initialTask?.status ?? 'To Do'
    });

    // If creating (no id) and initialTask changes, merge it in
    useEffect(() => {
        if (!id && initialTask) {
            setTask(prev => ({ ...prev, ...initialTask }));
        }
    }, [id, initialTask]);

    // If editing, load from API
    useEffect(() => {
        if (id) {
            api.get(`/tasks/${id}`)
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
            ? api.put(`/tasks/${id}`, { ...task, id })
            : api.post('/tasks', task);

        request
            .then(res => onSave && onSave(res.data))
            .catch(console.error);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingTaskTitle" label="Title">
                    <Form.Control
                        name="title"
                        type="text"
                        value={task.title}
                        onChange={handleChange}
                        placeholder="Title"
                        required
                    />
                </FloatingLabel>
            </Form.Group>

            <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingTaskDescription" label="Add a short description">
                    <Form.Control
                        as="textarea"
                        name="description"
                        value={task.description}
                        onChange={handleChange}
                        placeholder="Add a short description"
                        style={{ height: '100px' }}
                    />
                </FloatingLabel>
            </Form.Group>

            <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingTaskDate" label="Due Date">
                    <Form.Control
                        type="date"
                        name="dueDate"
                        value={task.dueDate?.split?.('T')[0] || ''}
                        onChange={handleChange}
                    />
                </FloatingLabel>
            </Form.Group>

            <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingSelect" label="Choose a status">
                    <Form.Select name="status" value={task.status} onChange={handleChange}>
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                    </Form.Select>
                </FloatingLabel>
            </Form.Group>

            <Form.Group className="text-end">
                <Button variant="secondary" className="me-2" onClick={() => onCancel && onCancel()}>Cancel</Button>
                <Button type="submit" variant="primary">{id ? 'Update' : 'Create'}</Button>
            </Form.Group>
        </Form>
    );
}

export default TaskForm;
