// src/components/TaskList.js
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    ButtonGroup,
    Col,
    Container,
    Form,
    InputGroup,
    ListGroup,
    Row,
    Spinner
} from 'react-bootstrap';
import api from '../services/api';
import TaskModal from './TaskModal';

const STATUS_OPTIONS = ['All', 'To Do', 'In Progress', 'Done'];
const SORT_BY_OPTIONS = [
    { value: 'created', label: 'Created' },
    { value: 'due', label: 'Due date' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' }
];

export default function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // filters
    const [keywords, setKeywords] = useState('');
    const [status, setStatus] = useState('All');
    const [dueFrom, setDueFrom] = useState('');
    const [dueTo, setDueTo] = useState('');
    const [sortBy, setSortBy] = useState('created');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // debounce keywords to avoid spamming the API
    const [keywordsDebounced, setKeywordsDebounced] = useState(keywords);
    useEffect(() => {
        const id = setTimeout(() => setKeywordsDebounced(keywords), 300);
        return () => clearTimeout(id);
    }, [keywords]);

    // Fetch tasks from the API
    const fetchTasks = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                keywords: keywordsDebounced || undefined,
                status: status !== 'All' ? status : undefined,
                dueFrom: dueFrom || undefined,
                dueTo: dueTo || undefined,
                sortBy,
                sortDir,
                page,
                pageSize
            };
            const res = await api.get('/tasks', { params });
            setTasks(res.data);

        } catch (err) {
            console.error(err);
            setError('Failed to load tasks. Check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch whenever any filter, sort, or page changes
    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keywordsDebounced, status, dueFrom, dueTo, sortBy, sortDir, page]);

    // Open modal for a new task
    const handleNew = () => {
        setEditingId(null);
        setShowModal(true);
    };

    // Open modal to edit an existing task
    const handleEdit = (id) => {
        setEditingId(id);
        setShowModal(true);
    };

    // When the form inside the modal has saved successfully
    const handleSaved = () => {
        setShowModal(false);  // close modal
        fetchTasks();         // refresh list
    };

    return (
        <Container className="py-3">
            <Row className="align-items-center">
                <Col><h1 className="mb-0">Tasks</h1></Col>
                <Col className="text-end">
                    <Button variant="success" onClick={handleNew} className="mb-2">
                        <strong>+ New Task</strong>
                    </Button>
                </Col>
            </Row>

            {/* Filters */}
            <Row className="g-2 mb-3 mt-1" as={Form}>
                <Col sm={3}>
                    <Form.Label>Keywords</Form.Label>
                    <InputGroup>
                        <Form.Control
                            placeholder="Search title or description"
                            value={keywords}
                            onChange={(e) => { setPage(1); setKeywords(e.target.value); }}
                        />
                    </InputGroup>
                </Col>

                <Col sm={2}>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                        value={status}
                        onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </Form.Select>
                </Col>

                <Col sm={2}>
                    <Form.Label>Due from</Form.Label>
                    <Form.Control
                        type="date"
                        value={dueFrom}
                        onChange={(e) => { setPage(1); setDueFrom(e.target.value); }}
                    />
                </Col>

                <Col sm={2}>
                    <Form.Label>Due to</Form.Label>
                    <Form.Control
                        type="date"
                        value={dueTo}
                        onChange={(e) => { setPage(1); setDueTo(e.target.value); }}
                    />
                </Col>

                <Col sm={2}>
                    <Form.Label>Sort by</Form.Label>
                    <Form.Select
                        value={sortBy}
                        onChange={(e) => { setPage(1); setSortBy(e.target.value); }}
                    >
                        {SORT_BY_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </Form.Select>
                </Col>

                <Col sm={1}>
                    <Form.Label>Dir</Form.Label>
                    <Form.Select
                        value={sortDir}
                        onChange={(e) => { setPage(1); setSortDir(e.target.value); }}
                    >
                        <option value="asc">Asc</option>
                        <option value="desc">Desc</option>
                    </Form.Select>
                </Col>
            </Row>

            {/* Loading / error */}
            {loading && (
                <Alert variant="info" className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" /> <span>Loading…</span>
                </Alert>
            )}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* List */}
            {!loading && !error && (
                <ListGroup>
                    {tasks.map(t => (
                        <ListGroup.Item
                            key={t.id}
                            className="d-flex justify-content-between align-items-center"
                        >
                            <div>
                                <strong>{t.title}</strong> — {t.status}
                                <br />
                                <small>
                                    Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'n/a'}
                                </small>
                            </div>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleEdit(t.id)}
                            >
                                Edit
                            </Button>
                        </ListGroup.Item>
                    ))}
                    {tasks.length === 0 && (
                        <ListGroup.Item>No tasks found.</ListGroup.Item>
                    )}
                </ListGroup>
            )}

            {/* Pager */}
            <div className="mt-3">
                <ButtonGroup>
                    <Button
                        variant="outline-secondary"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Prev
                    </Button>
                    <Button
                        variant="outline-secondary"
                        disabled={tasks.length < pageSize}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </ButtonGroup>
            </div>

            {/* Modal */}
            <TaskModal
                existingId={editingId}
                show={showModal}
                onClose={() => setShowModal(false)}
                onSaved={handleSaved}
            />
        </Container>
    );
}
