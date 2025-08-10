import React, { useMemo } from 'react';
import { Modal } from 'react-bootstrap';
import TaskForm from './TaskForm';

export default function TaskModal({ existingId, initialTask, show, onClose, onSaved }) {
    const title = useMemo(() => (existingId ? 'Edit Task' : 'New Task'), [existingId]);

    // Force remount of TaskForm when switching between edit/new or when initial status changes
    const formKey = useMemo(
        () => `${existingId ?? 'new'}-${initialTask?.status ?? ''}`,
        [existingId, initialTask?.status]
    );

    return (
        <Modal
            show={show}
            onHide={onClose}
            backdrop="static"
            keyboard={false}
            size="lg"
            centered
            scrollable
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TaskForm
                    key={formKey}
                    id={existingId || undefined}
                    initialTask={initialTask}
                    onSave={onSaved}
                    onCancel={onClose}
                />
            </Modal.Body>
        </Modal>
    );
}
