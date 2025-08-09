import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';

export default function RequireAuth() {
    const routerLocation = useLocation(); // <-- not the global
    return isAuthenticated()
        ? <Outlet />
        : <Navigate to="/login" replace state={{ from: routerLocation }} />;
}
