// src/layouts/AppLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function AppLayout() {
    return (
        <div className="app-shell d-flex">
            <Sidebar />
            <main className="content">
                <Header />
                <Outlet />
            </main>
        </div>
    );
}
