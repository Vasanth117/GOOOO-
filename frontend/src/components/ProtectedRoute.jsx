import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Show a spinner while token-verification runs
const Spinner = () => (
    <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f4f7f4'
    }}>
        <div style={{
            width: 48, height: 48, border: '4px solid #e8f3e5',
            borderTop: '4px solid #2d5a27', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// Protects routes that require login
export const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    return user ? children : <Navigate to="/login" replace />;
};

// Redirects logged-in users away from auth pages
export const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    return user ? <Navigate to="/dashboard" replace /> : children;
};
