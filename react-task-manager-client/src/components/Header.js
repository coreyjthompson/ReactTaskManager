// src/components/Header.js
import React from 'react';
import LogoutButton from './LogoutButton';

export default function Header() {
    return (
        <div className="p-3 text-end">
            <LogoutButton />
        </div>
    );
}
