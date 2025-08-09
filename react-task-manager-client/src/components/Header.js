// src/components/Header.js
import React from 'react';
import LogoutButton from './LogoutButton';

export default function Header() {
    return (
        <div className="container d-flex  py-3">
            <LogoutButton />
        </div>
    );
}
