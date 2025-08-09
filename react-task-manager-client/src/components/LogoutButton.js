import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

export default function LogoutButton({ className = '' }) {
    const navigate = useNavigate();
    const auth = useAuth();

    const handleLogout = () => {
        auth.logout();           // clears axios header + localStorage
        navigate('/login');      // send them to the login page
    };

    return (
        <Button variant="outline-secondary" size="sm" onClick={handleLogout}>Log out</Button>
    );
}
