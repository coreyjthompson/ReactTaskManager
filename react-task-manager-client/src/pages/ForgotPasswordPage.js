import React, { useState } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import api from '../services/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true); // always true even if email isn't registered
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="container my-4" style={{ maxWidth: 480 }}>
            <Card>
                <Card.Body>
                    <Card.Title>Forgot your password?</Card.Title>
                    <Card.Text>Enter your email and we’ll send you a reset link.</Card.Text>
                    {sent ? (
                        <Alert variant="success">
                            If an account exists for that email, a reset link has been sent.
                        </Alert>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Button type="submit">Send reset link</Button>
                        </Form>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
