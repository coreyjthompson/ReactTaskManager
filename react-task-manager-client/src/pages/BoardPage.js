// src/pages/BoardPage.js
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Stack } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import TaskModal from '../components/TaskModal';

const STATUSES = ['To Do', 'In Progress', 'Done'];

export default function BoardPage() {
    const [columns, setColumns] = useState(() =>
        Object.fromEntries(STATUSES.map(s => [s, []]))
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [initialTask, setInitialTask] = useState(null);

    const fetchTasks = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get('/tasks', { params: { page: 1, pageSize: 500, sortBy: 'created', sortDir: 'asc' } });
            const grouped = groupAndSort(res.data);
            setColumns(grouped);
        } catch (e) {
            console.error(e);
            setError('Failed to load tasks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    function groupAndSort(tasks) {
        const g = Object.fromEntries(STATUSES.map(s => [s, []]));
        for (const t of tasks) {
            const key = STATUSES.includes(t.status) ? t.status : 'To Do';
            g[key].push(t);
        }
        for (const s of STATUSES) {
            g[s].sort((a, b) => {
                const ao = Number.isFinite(a.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER;
                const bo = Number.isFinite(b.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER;
                return ao !== bo ? ao - bo : a.title.localeCompare(b.title);
            });
        }
        return g;
    }

    const openNew = (status = 'To Do') => {
        setEditingId(null);
        setInitialTask({ status });
        setShowModal(true);
    };

    const openEdit = (id) => {
        setInitialTask(null);
        setEditingId(id);
        setShowModal(true);
    };

    const onSaved = () => {
        setShowModal(false);
        fetchTasks();
    };

    const badgeVariant = (s) => (s === 'Done' ? 'success' : s === 'In Progress' ? 'warning' : 'secondary');

    const onDragEnd = useCallback(async (result) => {
        const { source, destination } = result;
        if (!destination) return;

        const from = source.droppableId;
        const to = destination.droppableId;
        const sameSpot = from === to && source.index === destination.index;
        if (sameSpot) return;

        // Build next columns immutably
        const next = Object.fromEntries(STATUSES.map(s => [s, Array.from(columns[s] || [])]));

        // Remove from source
        const [moved] = next[from].splice(source.index, 1);
        if (!moved) return;

        // Insert into destination; if moving columns, update status locally
        const movedUpdated = from === to ? moved : { ...moved, status: to };
        next[to].splice(destination.index, 0, movedUpdated);

        // Optimistic UI
        setColumns(next);

        // Persist new order(s)
        const payload =
            from === to
                ? [{ status: to, orderedIds: next[to].map(t => t.id) }]
                : [
                    { status: from, orderedIds: next[from].map(t => t.id) },
                    { status: to, orderedIds: next[to].map(t => t.id) }
                ];

        try {
            await api.patch('/tasks/reorder', payload);
        } catch (err) {
            console.error('Failed to persist reorder', err);
            setError('Failed to update order. Reverting.');
            fetchTasks(); // revert from server truth
        }
    }, [columns]);

    return (
        <div className="container my-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h1 className="mb-0">Board</h1>
                <Button onClick={() => openNew('To Do')} variant="success"><strong>+ New Task</strong></Button>
            </div>

            {loading && (
                <Alert variant="info">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading…
                </Alert>
            )}
            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Row className="g-3">
                        {STATUSES.map((s) => (
                            <Col key={s} md={4}>
                                <Droppable droppableId={s}>
                                    {(dropProvided, dropSnapshot) => (
                                        <Card className="h-100">
                                            <Card.Header className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <Badge bg={badgeVariant(s)}>{s}</Badge>
                                                    <span className="text-muted">({columns[s]?.length ?? 0})</span>
                                                </div>
                                                <Button size="sm" variant="outline-secondary" onClick={() => openNew(s)}>Add</Button>
                                            </Card.Header>
                                            <Card.Body
                                                ref={dropProvided.innerRef}
                                                {...dropProvided.droppableProps}
                                                style={{
                                                    background: dropSnapshot.isDraggingOver ? 'rgba(0,0,0,0.03)' : undefined,
                                                    minHeight: 80
                                                }}
                                            >
                                                <Stack gap={2}>
                                                    {(columns[s] ?? []).map((t, index) => (
                                                        <Draggable key={t.id} draggableId={String(t.id)} index={index}>
                                                            {(dragProvided, dragSnapshot) => (
                                                                <Card
                                                                    role="button"
                                                                    onClick={() => openEdit(t.id)}
                                                                    ref={dragProvided.innerRef}
                                                                    {...dragProvided.draggableProps}
                                                                    {...dragProvided.dragHandleProps}
                                                                    className="task-card"
                                                                    style={{
                                                                        ...dragProvided.draggableProps.style,
                                                                        opacity: dragSnapshot.isDragging ? 0.85 : 1
                                                                    }}
                                                                >
                                                                    <Card.Body className="p-2">
                                                                        <div className="d-flex justify-content-between">
                                                                            <strong>{t.title}</strong>
                                                                            <small className="text-muted">#{t.id}</small>
                                                                        </div>
                                                                        {t.description && (
                                                                            <div className="text-muted small">{t.description}</div>
                                                                        )}
                                                                        <div className="d-flex justify-content-between mt-1 small">
                                                                            <span>Status: {t.status}</span>
                                                                            <span>Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'n/a'}</span>
                                                                        </div>
                                                                    </Card.Body>
                                                                </Card>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {dropProvided.placeholder}
                                                    {(columns[s] ?? []).length === 0 && (
                                                        <div className="text-muted small">No tasks here.</div>
                                                    )}
                                                </Stack>
                                            </Card.Body>
                                        </Card>
                                    )}
                                </Droppable>
                            </Col>
                        ))}
                    </Row>
                </DragDropContext>
            )}

            <TaskModal
                existingId={editingId}
                initialTask={initialTask}
                show={showModal}
                onClose={() => setShowModal(false)}
                onSaved={onSaved}
            />
        </div>
    );
}
