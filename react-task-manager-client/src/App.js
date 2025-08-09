// src/App.js
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout'; // <- the layout with the left nav (Sidebar)
import BoardPage from './pages/BoardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public (no sidebar) */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected area: auth guard + app layout (left nav) */}
                    <Route element={<RequireAuth />}>
                        <Route element={<AppLayout />}>
                            <Route index element={<HomePage />} />
                            <Route path="board" element={<BoardPage />} />
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<LoginPage />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
