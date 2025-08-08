// src/components/TaskList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaskModal from './TaskModal';
import { Button, ListGroup } from 'react-bootstrap';

export default function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Fetch tasks from the API
    const fetchTasks = () => {
        axios.get('/api/tasks')
            .then(res => setTasks(res.data))
            .catch(console.error);
    };

    // On mount, and whenever showModal closes, re-fetch
    useEffect(() => {
        fetchTasks();
    }, []);

    // Open modal for a new task
    const handleNew = () => {
        setEditingId(null);
        setShowModal(true);
    };

    // Open modal to edit an existing task
    const handleEdit = id => {
        setEditingId(id);
        setShowModal(true);
    };

    // When the form inside the modal has saved successfully
    const handleSaved = savedTask => {
        setShowModal(false);  // close modal
        fetchTasks();         // refresh list
    };

    return (
        <div>
            <h1>Tasks</h1>
            <Button variant="success" onClick={handleNew} className="mb-3">
                <strong>+ New Task</strong>
            </Button>

            <ListGroup>
                {tasks.map(t => (
                    <ListGroup.Item key={t.id} className="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>{t.title}</strong> — {t.status}
                            <br />
                            <small>Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'n/a'}</small>
                        </div>
                        <Button variant="outline-secondary" size="sm" onClick={() => handleEdit(t.id)}>
                            Edit
                        </Button>
                    </ListGroup.Item>
                ))}
            </ListGroup>

            {/* Inline TaskModal, wired to this list’s state */}
            <TaskModal
                existingId={editingId}
                show={showModal}
                onClose={() => setShowModal(false)}
                onSaved={handleSaved}
            />
        </div>
    );
}
