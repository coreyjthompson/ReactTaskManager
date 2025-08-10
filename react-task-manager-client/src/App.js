import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import AppLayout from './layouts/AppLayout'; // <- the layout with the left nav (Sidebar)
import BoardPage from './pages/BoardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
    return (
        <AuthProvider>
            <LoadingProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public (no sidebar) */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                    <ToastContainer position="bottom-right" newestOnTop />
                </BrowserRouter>
            </LoadingProvider>
        </AuthProvider>
    );
}
