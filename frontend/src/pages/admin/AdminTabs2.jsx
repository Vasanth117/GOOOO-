import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldX, UserMinus, UserCheck, Trophy } from 'lucide-react';
import { adminFetch, SectionHeader, StatusBadge } from './adminUtils';

// ─── FRAUD TAB ────────────────────────────────────────────────
export const FraudTab = () => {
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        adminFetch('/admin/fraud-flags?status=open&limit=50')
            .then(d => { setFlags(d.flags || []); setLoading(false); })
            .catch(console.error);
    };
    useEffect(() => { load(); }, []);

    const resolve = async (flagId, action) => {
        const notes = prompt(`Enter notes for ${action}:`);
        if (notes === null) return;
        try {
            await adminFetch(`/admin/fraud-flags/${flagId}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ status: action, admin_notes: notes })
            });
            load();
        } catch (e) { alert(e.message); }
    };

    const severityStyle = {
        critical: { bg: '#fff0f0', border: '#fca5a5', color: '#9b1c1c' },
        high:     { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
        medium:   { bg: '#fffbeb', border: '#fde68a', color: '#d97706' },
        low:      { bg: '#f8faf8', border: '#eeedeb', color: '#666' },
    };

    return (
        <div>
            <SectionHeader title="Fraud Flags" sub="User activities flagged as suspicious or fake — take action below" />
            {loading ? (
                <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading flags...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {flags.length === 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: 60, textAlign: 'center' }}>
                            <ShieldCheck size={36} color="#16a34a" style={{ marginBottom: 12 }} />
                            <div style={{ fontWeight: 800, color: '#166534' }}>No open fraud flags</div>
                        </div>
                    )}
                    {flags.map(f => {
                        const s = severityStyle[f.severity] || severityStyle.low;
                        return (
                            <div key={f.id} style={{ background: s.bg, borderRadius: 16, border: `1px solid ${s.border}`, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ flexShrink: 0 }}>
                                    <ShieldX size={22} color={s.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 3 }}>{f.farmer_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: 6 }}>{f.reason} — {f.description}</div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <StatusBadge status={f.severity} />
                                        <span style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600 }}>{new Date(f.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button onClick={() => resolve(f.id, 'resolved')}
                                        style={{ padding: '8px 16px', background: '#fff', border: '1px solid #4ade80', borderRadius: 10, fontWeight: 800, color: '#166534', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                                        <ShieldCheck size={13} /> Resolve
                                    </button>
                                    <button onClick={() => resolve(f.id, 'dismissed')}
                                        style={{ padding: '8px 16px', background: '#fff', border: '1px solid #eeedeb', borderRadius: 10, fontWeight: 800, color: '#666', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── GRC TAB ──────────────────────────────────────────────────
export const GRCTab = () => {
    const [applications, setApplications] = useState([]);
    const [members, setMembers] = useState([]);
    const [view, setView] = useState('applications');
    const [loading, setLoading] = useState(true);

    const loadApps = () => {
        setLoading(true);
        adminFetch('/admin/grc/applications?status=pending&limit=50')
            .then(d => { setApplications(d.applications || []); setLoading(false); }).catch(console.error);
    };
    const loadMembers = () => {
        setLoading(true);
        adminFetch('/admin/grc/members?limit=50')
            .then(d => { setMembers(d.members || []); setLoading(false); }).catch(console.error);
    };

    useEffect(() => { view === 'applications' ? loadApps() : loadMembers(); }, [view]);

    const handleAction = async (id, action) => {
        const notes = action === 'reject' ? prompt('Reason for rejection?') : '';
        if (action === 'reject' && notes === null) return;
        try {
            await adminFetch(`/admin/grc/applications/${id}/action`, {
                method: 'POST', body: JSON.stringify({ action, notes })
            });
            loadApps();
        } catch (e) { alert(e.message); }
    };

    const removeMember = async (userId) => {
        if (!confirm('Remove this GRC member?')) return;
        try {
            await adminFetch(`/admin/grc/members/${userId}`, { method: 'DELETE' });
            loadMembers();
        } catch (e) { alert(e.message); }
    };

    return (
        <div>
            <SectionHeader title="Green Revolution Club" sub="Manage GRC membership applications and active members" />

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f8faf8', borderRadius: 14, padding: 4 }}>
                {[['applications', `Pending Applications (${applications.length})`], ['members', 'Active Members']].map(([id, label]) => (
                    <button key={id} onClick={() => setView(id)} style={{
                        flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                        background: view === id ? '#fff' : 'transparent',
                        color: view === id ? '#2d5a27' : '#888',
                        fontWeight: view === id ? 900 : 700,
                        cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit',
                        boxShadow: view === id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s'
                    }}>{label}</button>
                ))}
            </div>

            {loading ? (
                <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading...</div>
            ) : view === 'applications' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {applications.length === 0 && (
                        <div style={{ background: '#f8faf8', borderRadius: 16, padding: 60, textAlign: 'center', color: '#888', fontWeight: 700 }}>No pending applications</div>
                    )}
                    {applications.map(a => (
                        <div key={a.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #eeedeb', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#2d5a27', fontSize: '1.1rem', border: '1px solid #bbf7d0', flexShrink: 0 }}>
                                {a.farmer_name?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{a.farmer_name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 2 }}>{a.farmer_email}</div>
                                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 4 }}>
                                    Score: <strong style={{ color: '#2d5a27' }}>{a.score}</strong> · Applied {new Date(a.applied_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <button onClick={() => handleAction(a.id, 'approve')}
                                    style={{ padding: '8px 16px', background: '#f0fdf4', border: '1px solid #4ade80', borderRadius: 10, fontWeight: 800, color: '#166534', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                                    <UserCheck size={13} /> Approve
                                </button>
                                <button onClick={() => handleAction(a.id, 'reject')}
                                    style={{ padding: '8px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontWeight: 800, color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                                    <UserMinus size={13} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', overflow: 'hidden' }}>
                    {members.length === 0 ? (
                        <div style={{ color: '#888', textAlign: 'center', padding: 60, fontWeight: 700 }}>No GRC members yet</div>
                    ) : members.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', borderBottom: '1px solid #f4f4f2' }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#2d5a27', border: '1px solid #bbf7d0', flexShrink: 0 }}>
                                {m.name?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{m.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                                    {m.verifications_count} verifications · Joined {new Date(m.joined_at).toLocaleDateString()}
                                </div>
                            </div>
                            <button onClick={() => removeMember(m.farmer_id)}
                                style={{ padding: '7px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, fontWeight: 800, color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                                <UserMinus size={12} /> Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── LEADERBOARD TAB ──────────────────────────────────────────
export const LeaderboardTab = ({ onSelectUser }) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch('/admin/leaderboard?limit=50')
            .then(d => { setRows(d.leaderboard || []); setLoading(false); })
            .catch(console.error);
    }, []);

    return (
        <div>
            <SectionHeader title="Leaderboard" sub="Full ranking by sustainability score — click a user to adjust their points" />
            {loading ? (
                <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading...</div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    {rows.map((u, i) => (
                        <div key={u.farmer_id}
                            onClick={() => onSelectUser({ id: u.farmer_id, name: u.name, email: u.email, role: u.role })}
                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', borderBottom: '1px solid #f4f4f2', cursor: 'pointer', transition: 'background 0.12s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8faf8'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                                {i < 3 ? (
                                    <Trophy size={18} color={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309'} />
                                ) : (
                                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#aaa' }}>#{u.rank}</span>
                                )}
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#2d5a27', fontSize: '0.88rem', border: '1px solid #bbf7d0', flexShrink: 0 }}>
                                {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{u.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: 2 }}>
                                    {typeof u.location === 'object' && u.location !== null 
                                        ? `${u.location.latitude?.toFixed(4)}, ${u.location.longitude?.toFixed(4)}` 
                                        : u.location || 'No location set'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 950, color: '#2d5a27', fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif' }}>{u.score}</div>
                                <div style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 700, marginTop: 2 }}>{u.badges_count} badges</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
