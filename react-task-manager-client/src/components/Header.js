// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="container d-flex justify-content-between align-items-center py-3">
            <Link to="/" className="text-decoration-none"><h4 className="m-0">Task Manager</h4></Link>
            <div>
                {isAuthenticated ? (
                    <LogoutButton />
                ) : (
                    <>
                        <Link className="btn btn-outline-primary btn-sm me-2" to="/login">Sign in</Link>
                        <Link className="btn btn-primary btn-sm" to="/register">Create account</Link>
                    </>
                )}
            </div>
        </div>
    );
}
