import React from 'react';
import { Modal } from 'react-bootstrap';
import TaskForm from './TaskForm';

export default function TaskModal({ existingId, show, onClose, onSaved }) {
    // existingId: optional, if you’re editing an existing task
    // show/onClose control the Modal’s visibility

    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{existingId ? 'Edit Task' : 'New Task'}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <TaskForm
                    id={existingId}
                    onSave={savedTask => onSaved && onSaved(savedTask)}
                    onCancel={() => onClose && onClose()}
                />
            </Modal.Body>
        </Modal>
    );
}
