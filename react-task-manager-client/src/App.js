import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NewTaskPage from './pages/NewTaskPage';
import EditTaskPage from './pages/EditTaskPage';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/new" element={<NewTaskPage />} />
                <Route path="/edit/:id" element={<EditTaskPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;