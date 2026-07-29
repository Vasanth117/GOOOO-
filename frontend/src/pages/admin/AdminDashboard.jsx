import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, FileCheck, AlertTriangle,
    Leaf, Trophy, Gift, Award, Bell, LogOut,
    ShieldAlert, Sprout
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch, OverviewTab } from './adminUtils';
import { UsersTab, ProofsTab } from './AdminTabs1';
import { FraudTab, GRCTab, LeaderboardTab } from './AdminTabs2';
import { RewardsTab, BadgesTab, AlertsTab } from './AdminTabs3';
import { MarketplaceTab } from './AdminTabs4';
import { Store, Menu } from 'lucide-react';

const NAV = [
    { id: 'overview',     icon: LayoutDashboard, label: 'Overview',             sub: 'Platform stats' },
    { id: 'users',        icon: Users,            label: 'Users',                sub: 'Manage accounts' },
    { id: 'marketplace',  icon: Store,            label: 'Marketplace',          sub: 'Products & Industries' },
    { id: 'proofs',       icon: FileCheck,        label: 'Proof Review',         sub: '4-day verification' },
    { id: 'fraud',        icon: ShieldAlert,      label: 'Fraud Flags',          sub: 'Suspicious activity' },
    { id: 'grc',          icon: Leaf,             label: 'Green Revolution Club', sub: 'GRC membership' },
    { id: 'leaderboard',  icon: Trophy,           label: 'Leaderboard',          sub: 'Rankings & scores' },
    { id: 'rewards',      icon: Gift,             label: 'Rewards & Vouchers',   sub: 'Create & manage' },
    { id: 'badges',       icon: Award,            label: 'Badges',               sub: 'Achievements' },
    { id: 'alerts',       icon: Bell,             label: 'Admin Alerts',         sub: 'System notifications' },
];

// ─── USER DETAIL MODAL ────────────────────────────────────────
const UserDetailModal = ({ user, onClose }) => {
    const [detail, setDetail] = useState(null);
    const [tab, setTab] = useState('overview');
    const [adjustPts, setAdjustPts] = useState({ delta: 0, reason: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.id) {
            adminFetch(`/admin/users/${user.id}`).then(setDetail).catch(console.error);
        }
    }, [user]);

    const handleAdjust = async () => {
        if (!adjustPts.reason) return alert('Please enter a reason');
        setSubmitting(true);
        try {
            await adminFetch(`/admin/users/${user.id}/adjust-points`, {
                method: 'POST',
                body: JSON.stringify({ delta: Number(adjustPts.delta), reason: adjustPts.reason })
            });
            alert('Points adjusted successfully!');
            onClose();
        } catch (e) { alert(e.message); }
        finally { setSubmitting(false); }
    };

    const handleBan = async (active) => {
        if (!confirm(`${active ? 'Activate' : 'Ban'} this user?`)) return;
        try {
            await adminFetch(`/admin/users/${user.id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active: active }) });
            alert(`User ${active ? 'activated' : 'banned'}!`);
            onClose();
        } catch (e) { alert(e.message); }
    };

    const handleRoleChange = async (role) => {
        if (!confirm(`Change role to ${role}?`)) return;
        try {
            await adminFetch(`/admin/users/${user.id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
            alert(`Role updated to ${role}`);
        } catch (e) { alert(e.message); }
    };

    const MODAL_TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'missions', label: 'Missions' },
        { id: 'proofs', label: 'Proofs' },
        { id: 'scores', label: 'Score Log' },
        { id: 'actions', label: 'Actions' },
    ];

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1').replace('/api/v1', '');

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
            <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '20px 28px', borderBottom: '1px solid #eeedeb', display: 'flex', alignItems: 'center', gap: 16, background: '#f8faf8' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-primary-soft, #f0fdf4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', color: '#2d5a27', border: '2px solid #4ade80' }}>
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif', color: '#1a1c19' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>{user?.email} · {user?.role}</div>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: '#eee', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✕</button>
                </div>

                {/* Sub-tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eeedeb', padding: '0 24px', overflowX: 'auto' }}>
                    {MODAL_TABS.map(({ id, label }) => (
                        <button key={id} onClick={() => setTab(id)} style={{ padding: '12px 16px', border: 'none', background: 'transparent', fontWeight: tab === id ? 900 : 600, color: tab === id ? '#2d5a27' : '#888', borderBottom: tab === id ? '3px solid #2d5a27' : '3px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem', transition: 'all 0.15s' }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    {!detail ? <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading...</div> : (
                        <>
                            {tab === 'overview' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    {[
                                        ['Farm Location', typeof detail.farm?.location === 'object' && detail.farm?.location !== null ? `${detail.farm.location.latitude?.toFixed(4)}, ${detail.farm.location.longitude?.toFixed(4)}` : detail.farm?.location || '—'],
                                        ['Farm Size', detail.farm ? `${detail.farm.size_acres} acres` : '—'],
                                        ['Sustainability Score', detail.farm?.sustainability_score ?? '—'],
                                        ['Crops', (detail.farm?.crops || []).join(', ') || '—'],
                                        ['Badges Earned', detail.badges?.length ?? 0],
                                        ['GRC Member', detail.grc_member ? 'Yes' : 'No'],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ background: '#f8faf8', borderRadius: 14, padding: '14px 18px' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                                            <div style={{ fontWeight: 900, color: '#1a1c19', fontSize: '0.95rem' }}>{String(v)}</div>
                                        </div>
                                    ))}
                                    {detail.badges?.length > 0 && (
                                        <div style={{ gridColumn: '1/-1', background: '#f8faf8', borderRadius: 14, padding: '14px 18px' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 800, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Badges</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {detail.badges.map((b, i) => <span key={i} style={{ background: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: 8, fontWeight: 800, fontSize: '0.8rem', border: '1px solid #bbf7d0' }}>{b.icon} {b.name}</span>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {tab === 'missions' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {detail.recent_missions?.length === 0 && <div style={{ color: '#888', textAlign: 'center', padding: 32 }}>No missions</div>}
                                    {detail.recent_missions?.map((m, i) => (
                                        <div key={i} style={{ background: '#f8faf8', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Mission {m.id?.slice(-6)}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>{m.started_at ? new Date(m.started_at).toLocaleDateString() : 'Not started'}</div>
                                            </div>
                                            <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 900, textTransform: 'capitalize', background: m.status === 'completed' ? '#f0fdf4' : '#fffbeb', color: m.status === 'completed' ? '#166534' : '#d97706' }}>{m.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {tab === 'proofs' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                                    {detail.recent_proofs?.length === 0 && <div style={{ color: '#888', textAlign: 'center', padding: 32, gridColumn: '1/-1' }}>No proofs submitted</div>}
                                    {detail.recent_proofs?.map((p, i) => (
                                        <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #eeedeb' }}>
                                            <img src={`${baseUrl}${p.file_url}`} alt="proof" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                                            <div style={{ padding: '10px 12px' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 4 }}>{new Date(p.submitted_at).toLocaleDateString()}</div>
                                                <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 900, textTransform: 'capitalize', background: p.status === 'approved' ? '#f0fdf4' : p.status === 'rejected' ? '#fef2f2' : '#fffbeb', color: p.status === 'approved' ? '#166534' : p.status === 'rejected' ? '#dc2626' : '#d97706' }}>{p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {tab === 'scores' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {detail.score_history?.map((s, i) => (
                                        <div key={i} style={{ background: s.delta < 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${s.delta < 0 ? '#fecaca' : '#bbf7d0'}` }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{s.description}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 2 }}>{new Date(s.logged_at).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 900, color: s.delta < 0 ? '#dc2626' : '#166534', fontSize: '1rem' }}>{s.delta > 0 ? '+' : ''}{s.delta}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#888' }}>→ {s.score_after}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {tab === 'actions' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ background: '#f8faf8', borderRadius: 16, padding: 20 }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 14, color: '#1a1c19' }}>Adjust Points</div>
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                            <input type="number" value={adjustPts.delta} onChange={e => setAdjustPts(p => ({ ...p, delta: e.target.value }))} placeholder="e.g. -50 to deduct, +50 to add"
                                                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid #eeedeb', outline: 'none', fontSize: '0.9rem' }} />
                                        </div>
                                        <input value={adjustPts.reason} onChange={e => setAdjustPts(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for adjustment (required)"
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #eeedeb', outline: 'none', marginBottom: 12, boxSizing: 'border-box', fontSize: '0.9rem' }} />
                                        <button onClick={handleAdjust} disabled={submitting} style={{ padding: '10px 24px', background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                                            {submitting ? 'Applying...' : 'Apply Adjustment'}
                                        </button>
                                    </div>

                                    <div style={{ background: '#f8faf8', borderRadius: 16, padding: 20 }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 14, color: '#1a1c19' }}>Change Role</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {['farmer', 'expert', 'seller', 'grc'].map(role => (
                                                <button key={role} onClick={() => handleRoleChange(role)}
                                                    style={{ padding: '8px 18px', background: '#fff', border: '1px solid #eeedeb', borderRadius: 10, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.85rem', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.target.style.borderColor = '#2d5a27'; e.target.style.color = '#2d5a27'; }}
                                                    onMouseLeave={e => { e.target.style.borderColor = '#eeedeb'; e.target.style.color = '#1a1c19'; }}>
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ background: '#fef2f2', borderRadius: 16, padding: 20, border: '1px solid #fecaca' }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 14, color: '#dc2626' }}>Account Status</div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button onClick={() => handleBan(true)} style={{ padding: '9px 18px', background: '#f0fdf4', border: '1px solid #4ade80', borderRadius: 10, fontWeight: 800, color: '#166534', cursor: 'pointer', fontSize: '0.85rem' }}>Activate Account</button>
                                            <button onClick={() => handleBan(false)} style={{ padding: '9px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontWeight: 800, color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem' }}>Ban User</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN ADMIN DASHBOARD ─────────────────────────────────────
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { navigate('/login'); return; }
        adminFetch('/admin/stats').then(setStats).catch(() => navigate('/login'));
    }, []);

    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const activeNav = NAV.find(n => n.id === activeTab);

    const renderTab = () => {
        switch (activeTab) {
            case 'overview':    return <OverviewTab stats={stats} />;
            case 'users':       return <UsersTab onSelectUser={setSelectedUser} />;
            case 'marketplace': return <MarketplaceTab />;
            case 'proofs':      return <ProofsTab />;
            case 'fraud':       return <FraudTab />;
            case 'grc':         return <GRCTab />;
            case 'leaderboard': return <LeaderboardTab onSelectUser={setSelectedUser} />;
            case 'rewards':     return <RewardsTab />;
            case 'badges':      return <BadgesTab />;
            case 'alerts':      return <AlertsTab />;
            default:            return null;
        }
    };

    return (
        <div className="dashboard-root" style={{ display: 'flex', height: '100vh', background: '#fbfdfb', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            {/* Mobile Overlay */}
            <div 
                className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} 
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* ── SIDEBAR (same style as DashboardLayout) ── */}
            <aside
                className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
                onMouseEnter={() => setSidebarHovered(true)}
                onMouseLeave={() => setSidebarHovered(false)}
                style={{
                    width: sidebarHovered && !mobileMenuOpen ? 240 : 68,

                    background: '#ffffff',
                    borderRight: '1px solid #eeedeb',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '4px 0 24px rgba(0,0,0,0.04)',
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    zIndex: 100,
                }}
            >
                {/* Logo */}
                <div style={{ padding: '20px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #eeedeb', flexShrink: 0 }} onClick={() => navigate('/login')}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #2d5a27, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sprout size={20} color="#fff" />
                    </div>
                    {sidebarHovered && (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1a1c19', fontFamily: 'Outfit, sans-serif' }}>GOO Admin</div>
                            <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 700 }}>Command Center</div>
                        </div>
                    )}
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', scrollbarWidth: 'none' }}>
                    {NAV.map(({ id, icon: Icon, label }) => {
                        const isActive = activeTab === id;
                        return (
                            <button key={id} onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }} style={{
                                display: 'flex', alignItems: 'center', width: '100%',
                                padding: '11px 13px', border: 'none',
                                background: isActive ? '#f0fdf4' : 'transparent',
                                borderRadius: 12,
                                color: isActive ? '#2d5a27' : '#4a4d48',
                                fontWeight: isActive ? 800 : 600,
                                cursor: 'pointer', position: 'relative', marginBottom: 2,
                                transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8faf8'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Icon size={20} style={{ minWidth: 20, flexShrink: 0 }} />
                                {sidebarHovered && <span style={{ marginLeft: 14, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{label}</span>}
                                {isActive && <div style={{ position: 'absolute', right: 0, width: 3, height: 20, background: '#2d5a27', borderRadius: '4px 0 0 4px' }} />}
                            </button>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: '12px 8px', borderTop: '1px solid #eeedeb', flexShrink: 0 }}>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '11px 13px', border: 'none', background: 'transparent', borderRadius: 12, color: '#e63946', fontWeight: 800, cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={20} style={{ minWidth: 20, flexShrink: 0 }} />
                        {sidebarHovered && <span style={{ marginLeft: 14, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="dashboard-main" style={{ flex: 1, display: 'grid', gridTemplateRows: '72px 1fr', height: '100vh', overflow: 'hidden' }}>

                {/* Header (same style as DashboardLayout) */}
                <header className="dashboard-header" style={{
                    height: 72, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid #eeedeb', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '0 36px',
                    position: 'sticky', top: 0, zIndex: 90
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
                                <Menu size={24} color="#1a1c19" />
                            </button>
                            {activeNav && <activeNav.icon size={20} color="#2d5a27" />}
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 950, margin: 0, fontFamily: 'Outfit, sans-serif', color: '#1a1c19' }}>{activeNav?.label}</h2>
                        </div>
                        <span style={{ fontSize: '0.73rem', color: '#888', fontWeight: 600, paddingLeft: 34 }}>{activeNav?.sub}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {stats?.open_fraud_flags > 0 && (
                            <div onClick={() => setActiveTab('fraud')} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={13} />
                                {stats.open_fraud_flags} fraud flags
                            </div>
                        )}
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldAlert size={13} />
                            Admin Panel
                        </div>
                    </div>
                </header>

                {/* Scrollable content */}
                <main className="dashboard-content" style={{ overflowY: 'auto', padding: 32, minHeight: 0 }}>
                    {renderTab()}
                </main>
            </div>

            {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
        </div>
    );
};

export default AdminDashboard;
