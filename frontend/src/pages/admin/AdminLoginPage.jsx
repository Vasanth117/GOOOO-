import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_API = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const AdminLoginPage = () => {
    const [email, setEmail] = useState('admin@goo.farm');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${ADMIN_API}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');
            localStorage.setItem('admin_token', data.data.access_token);
            localStorage.setItem('admin_user', JSON.stringify(data.data.admin));
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0d0f0c 0%, #1a2e18 50%, #0d1f0b 100%)'
        }}>
            {/* Animated BG dots */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: Math.random() * 4 + 2,
                        height: Math.random() * 4 + 2,
                        borderRadius: '50%',
                        background: 'rgba(74, 222, 128, 0.3)',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
                    }} />
                ))}
            </div>

            <div style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(74,222,128,0.15)',
                borderRadius: 32,
                padding: '56px 48px',
                width: '100%',
                maxWidth: 440,
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'linear-gradient(135deg, #2d5a27, #4ade80)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 12px 32px rgba(45,90,39,0.4)',
                        fontSize: 32
                    }}>🌿</div>
                    <h1 style={{ color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 900, margin: 0 }}>
                        GOO Admin
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8, fontSize: '0.9rem' }}>
                        Secure Command Center
                    </p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                            Admin Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '14px 18px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '1rem', outline: 'none',
                                transition: 'border-color 0.2s', boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="Enter admin password"
                            style={{
                                width: '100%', padding: '14px 18px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '1rem', outline: 'none',
                                transition: 'border-color 0.2s', boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)',
                            borderRadius: 12, padding: '12px 16px', color: '#ff6b7a',
                            fontSize: '0.85rem', marginBottom: 20, fontWeight: 700
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '16px',
                            background: loading ? 'rgba(45,90,39,0.5)' : 'linear-gradient(135deg, #2d5a27, #4ade80)',
                            border: 'none', borderRadius: 16, color: '#fff',
                            fontSize: '1rem', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 8px 24px rgba(45,90,39,0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            letterSpacing: '0.02em'
                        }}
                        onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 32px rgba(45,90,39,0.5)'; }}}
                        onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(45,90,39,0.4)'; }}
                    >
                        {loading ? '🔐 Authenticating...' : '🚀 Access Admin Panel'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                    Restricted Access • Authorized Personnel Only
                </p>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); opacity: 0.3; }
                    50% { transform: translateY(-20px); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

export default AdminLoginPage;
