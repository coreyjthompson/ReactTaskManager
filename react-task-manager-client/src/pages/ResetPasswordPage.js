import React, { useState, useMemo } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const emailFromUrl = params.get('email') || '';
    const tokenFromUrl = params.get('token') || '';

    // Guard: if token/email missing, show simple error UI
    const invalidLink = useMemo(() => !emailFromUrl || !tokenFromUrl, [emailFromUrl, tokenFromUrl]);

    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        try {
            await api.post('/auth/reset-password', {
                email: emailFromUrl,
                token: tokenFromUrl,   // token is URL-encoded in the link; just pass through
                newPassword
            });
            setDone(true);
            setTimeout(() => navigate('/login'), 1200);
        } catch (err) {
            console.error(err);
            // Backend may return a list of errors; show a generic message for safety
            setError('Could not reset password. The link may be invalid or expired.');
        }
    };

    if (invalidLink) {
        return (
            <div className="container my-4" style={{ maxWidth: 480 }}>
                <Alert variant="danger">Invalid reset link.</Alert>
            </div>
        );
    }

    return (
        <div className="container my-4" style={{ maxWidth: 480 }}>
            <Card>
                <Card.Body>
                    <Card.Title>Set a new password</Card.Title>
                    <Card.Text className="text-muted small">for {emailFromUrl}</Card.Text>
                    {done ? (
                        <Alert variant="success">Password updated. Redirecting to login…</Alert>
                    ) : (
                        <Form onSubmit={submit}>
                            <Form.Group className="mb-3">
                                <Form.Label>New password</Form.Label>
                                <Form.Control
                                    type="password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Confirm new password</Form.Label>
                                <Form.Control
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </Form.Group>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Button type="submit">Update password</Button>
                        </Form>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
