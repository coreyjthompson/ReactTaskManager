// src/components/TaskModal.js
import React from 'react';
import { Modal } from 'react-bootstrap';
import TaskForm from './TaskForm';

export default function TaskModal({ existingId, initialTask, show, onClose, onSaved }) {
    const title = existingId ? 'Edit Task' : 'New Task';

    return (
        <Modal show={show} onHide={onClose} backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TaskForm
                    id={existingId || undefined}
                    initialTask={initialTask}
                    onSave={onSaved}
                    onCancel={onClose}
                />
            </Modal.Body>
        </Modal>
    );
}
