import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './contexts/AuthContext';
import BoardPage from './pages/BoardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Header />
                <Routes>
                    {/* public */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* protected */}
                    <Route element={<RequireAuth />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/board" element={<BoardPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
