import React, { useState } from 'react';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function LoginPage() {
    const auth = useAuth();
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const from = routerLocation.state?.from?.pathname || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            auth.login(res.data.token);
            navigate(from, { replace: true });
        } catch {
            setError('Invalid email or password.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 420 }}>
            <Card>
                <Card.Body>
                    <h4 className="m-0 mb-3 text-center text-primary">Task Manager</h4>
                    <Card.Title className="mb-3 text-center">Sign in</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}

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

                        <Form.Group className="mb-0">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </Form.Group>
                        <div className="mb-4 text-end">
                            <small>
                                <Link to="/forgot-password">Forgot your password?</Link>
                            </small>
                        </div>
                        <div className="d-grid gap-2">
                            <Button type="submit" variant="primary" disabled={submitting}>
                                {submitting ? <Spinner size="sm" animation="border" /> : 'Sign in'}
                            </Button>
                        </div>
                    </Form>

                    <div className="mt-3 text-center">
                        <small>
                            Don’t have an account? <Link to="/register">Create one</Link>
                        </small>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
