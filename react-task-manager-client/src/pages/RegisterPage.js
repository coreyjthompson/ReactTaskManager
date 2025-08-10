import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import api from '../services/api';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setSubmitting(true);
        setError('');
        setSuccessMsg('');
        try {
            await api.post('/auth/register', { email, password });

            // No auto-login: show a brief success message, then send to /login
            setSuccessMsg('Account created successfully. Please sign in.');
            setTimeout(() => navigate('/login'), 800);
        } catch (err) {
            const apiMsg = err?.response?.data ?? 'Registration failed.';
            setError(typeof apiMsg === 'string' ? apiMsg : 'Registration failed.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 420 }}>
            <Card>
                <Card.Body>
                    <h4 className="m-0 mb-3 text-center text-primary">Task Manager</h4>
                    <Card.Title className="mb-3 text-center">Create account</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {successMsg && <Alert variant="success">{successMsg}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Confirm password</Form.Label>
                            <Form.Control
                                type="password"
                                autoComplete="new-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Repeat password"
                                required
                            />
                        </Form.Group>

                        <div className="d-grid gap-2">
                            <Button type="submit" variant="primary" disabled={submitting}>
                                {submitting ? <Spinner size="sm" animation="border" /> : 'Create account'}
                            </Button>
                        </div>
                    </Form>

                    <div className="mt-3 text-center">
                        <small>
                            Already have an account? <Link to="/login">Sign in</Link>
                        </small>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
