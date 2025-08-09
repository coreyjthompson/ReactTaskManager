// src/pages/BoardPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Stack } from 'react-bootstrap';
import api from '../services/api';
import TaskModal from '../components/TaskModal';

const STATUSES = ['To Do', 'In Progress', 'Done'];

export default function BoardPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const fetchTasks = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get('/tasks', {
                params: { sortBy: 'created', sortDir: 'asc', page: 1, pageSize: 500 }
            });
            setTasks(res.data);
        } catch (e) {
            console.error(e);
            setError('Failed to load tasks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const grouped = useMemo(() => {
        const g = Object.fromEntries(STATUSES.map(s => [s, []]));
        for (const t of tasks) {
            const key = STATUSES.includes(t.status) ? t.status : 'To Do';
            g[key].push(t);
        }
        // Sort within each column: due date (soonest first), then title
        for (const s of STATUSES) {
            g[s].sort((a, b) => {
                const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                if (ad !== bd) return ad - bd;
                return a.title.localeCompare(b.title);
            });
        }
        return g;
    }, [tasks]);

    const openNew = () => { setEditingId(null); setShowModal(true); };
    const openEdit = (id) => { setEditingId(id); setShowModal(true); };
    const onSaved = () => { setShowModal(false); fetchTasks(); };

    const badgeVariant = (s) => (s === 'Done' ? 'success' : s === 'In Progress' ? 'warning' : 'secondary');

    return (
        <div className="container my-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h1 className="mb-0">Board</h1>
                <Button onClick={openNew} variant="success"><strong>+ New Task</strong></Button>
            </div>

            {loading && (
                <Alert variant="info">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading…
                </Alert>
            )}
            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && (
                <Row className="g-3">
                    {STATUSES.map((s) => (
                        <Col key={s} md={4}>
                            <Card className="h-100">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg={badgeVariant(s)}>{s}</Badge>
                                        <span className="text-muted">({grouped[s]?.length ?? 0})</span>
                                    </div>
                                    <Button size="sm" variant="outline-secondary" onClick={openNew}>Add</Button>
                                </Card.Header>
                                <Card.Body>
                                    <Stack gap={2}>
                                        {(grouped[s] ?? []).map(t => (
                                            <Card
                                                key={t.id}
                                                className="task-card"
                                                role="button"
                                                onClick={() => openEdit(t.id)}
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
                                                        <span>
                                                            Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'n/a'}
                                                        </span>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                        {(grouped[s] ?? []).length === 0 && (
                                            <div className="text-muted small">No tasks here.</div>
                                        )}
                                    </Stack>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <TaskModal
                existingId={editingId}
                show={showModal}
                onClose={() => setShowModal(false)}
                onSaved={onSaved}
            />
        </div>
    );
}
