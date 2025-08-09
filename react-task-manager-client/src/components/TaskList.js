// src/components/TaskList.js
import React, { useEffect, useState } from 'react';
import { Button, Col, ListGroup, Row } from 'react-bootstrap';
import api from '../services/api';
import TaskModal from './TaskModal';

const STATUS_OPTIONS = ['All', 'To Do', 'In Progress', 'Done'];
const SORT_BY_OPTIONS = [
    { value: 'created', label: 'Created' },
    { value: 'due', label: 'Due date' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
    // NEW: uses DB SortOrder (per-column order from the Board)
    { value: 'manual', label: 'Board order' }
];

export default function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // filters
    const [keywords, setKeywords] = useState('');       // was `q`
    const [status, setStatus] = useState('All');
    const [dueFrom, setDueFrom] = useState('');
    const [dueTo, setDueTo] = useState('');
    const [sortBy, setSortBy] = useState('created');    // 'manual' = SortOrder
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // debounce keywords
    const [keywordsDebounced, setKeywordsDebounced] = useState(keywords);
    useEffect(() => {
        const id = setTimeout(() => setKeywordsDebounced(keywords), 300);
        return () => clearTimeout(id);
    }, [keywords]);

    // If user selects "Board order" but Status is "All", fall back to Created
    useEffect(() => {
        if (sortBy === 'manual' && status === 'All') {
            setSortBy('created');
            setSortDir('desc');
        }
    }, [status, sortBy]);

    const fetchTasks = async () => {
        setLoading(true);
        setError('');
        try {
            // Map UI sort to API sort
            const apiSortBy = sortBy === 'manual' ? 'sortOrder' : sortBy;
            const apiSortDir = sortBy === 'manual' ? 'asc' : sortDir; // SortOrder is numeric ascending
            const params = {
                q: keywordsDebounced || undefined,
                status: status !== 'All' ? status : undefined,
                dueFrom: dueFrom || undefined,
                dueTo: dueTo || undefined,
                sortBy: apiSortBy,
                sortDir: apiSortDir,
                page,
                pageSize
            };
            const res = await api.get('/tasks', { params });
            setTasks(res.data);
            // If you add X-Total-Count on the API, you can use it for real pagination
            // const total = Number(res.headers['x-total-count'] ?? 0);
        } catch (err) {
            console.error(err);
            setError('Failed to load tasks. Check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keywordsDebounced, status, dueFrom, dueTo, sortBy, sortDir, page]);

    const handleNew = () => {
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = id => {
        setEditingId(id);
        setShowModal(true);
    };

    const handleSaved = () => {
        setShowModal(false);
        fetchTasks();
    };

    return (
        <div>
            <h1>
                <Row>
                    <Col>Tasks</Col>
                    <Col className="text-end">
                        <Button variant="success" onClick={handleNew} className="mb-3">
                            <strong>+ New Task</strong>
                        </Button>
                    </Col>
                </Row>
            </h1>

            {/* Filters */}
            <div className="row g-2 mb-3">
                <div className="col-sm-3">
                    <input
                        className="form-control"
                        placeholder="Search title or description"
                        value={keywords}
                        onChange={e => { setPage(1); setKeywords(e.target.value); }}
                    />
                </div>

                <div className="col-sm-2">
                    <select
                        className="form-select"
                        value={status}
                        onChange={e => { setPage(1); setStatus(e.target.value); }}
                    >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="col-sm-2">
                    <input
                        type="date"
                        className="form-control"
                        value={dueFrom}
                        onChange={e => { setPage(1); setDueFrom(e.target.value); }}
                    />
                </div>

                <div className="col-sm-2">
                    <input
                        type="date"
                        className="form-control"
                        value={dueTo}
                        onChange={e => { setPage(1); setDueTo(e.target.value); }}
                    />
                </div>

                <div className="col-sm-2">
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={e => { setPage(1); setSortBy(e.target.value); }}
                        title={status === 'All' ? 'Board order works per status column. Choose a single status.' : undefined}
                    >
                        {SORT_BY_OPTIONS.map(o => (
                            <option
                                key={o.value}
                                value={o.value}
                                disabled={o.value === 'manual' && status === 'All'}
                            >
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-sm-1">
                    <select
                        className="form-select"
                        value={sortDir}
                        onChange={e => setSortDir(e.target.value)}
                        disabled={sortBy === 'manual'}  // dir is fixed to asc for SortOrder
                    >
                        <option value="asc">Asc</option>
                        <option value="desc">Desc</option>
                    </select>
                </div>
            </div>

            {/* Loading / error */}
            {loading && <div className="alert alert-info">Loading…</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* List */}
            {!loading && !error && (
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
            )}

            {/* Pager */}
            <div className="mt-3 d-flex gap-2">
                <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <button className="btn btn-outline-secondary" onClick={() => setPage(p => p + 1)}>Next</button>
            </div>

            {/* Modal */}
            <TaskModal
                existingId={editingId}
                initialTask={null}
                show={showModal}
                onClose={() => setShowModal(false)}
                onSaved={handleSaved}
            />
        </div>
    );
}
