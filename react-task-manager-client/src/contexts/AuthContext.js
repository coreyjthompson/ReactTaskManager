import React, { createContext, useContext, useEffect, useState } from 'react';
import { setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('jwt') || null);

    const login = (jwt) => {
        setAuthToken(jwt);   // sets axios header + localStorage
        setToken(jwt);
    };

    const logout = () => {
        setAuthToken(null);  // clears header + localStorage
        setToken(null);
    };

    const value = { token, isAuthenticated: !!token, login, logout };

    // keep state in sync if other tabs log in/out
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'jwt') {
                setToken(localStorage.getItem('jwt'));
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
