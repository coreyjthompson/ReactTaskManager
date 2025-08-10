// src/components/Sidebar.js
import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    return (
        <aside className="sidebar p-3">
            <h5 className="mb-4">Task Manager</h5>
            <Nav className="flex-column gap-1">
                <Nav.Link as={NavLink} to="/" end>
                    Task List
                </Nav.Link>
                <Nav.Link as={NavLink} to="/board">
                    Board
                </Nav.Link>
            </Nav>
        </aside>
    );
}
