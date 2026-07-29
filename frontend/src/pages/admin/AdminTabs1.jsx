import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { adminFetch, SectionHeader, StatusBadge } from './adminUtils';

// ─── USERS TAB ────────────────────────────────────────────────
export const UsersTab = ({ onSelectUser }) => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (roleFilter) params.set('role', roleFilter);
            const data = await adminFetch(`/admin/users?${params}&limit=50`);
            setUsers(data.users || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [search, roleFilter]);

    const HEADERS = ['Name', 'Email', 'Role', 'Status', 'Score', 'Badges', 'Missions', ''];

    return (
        <div>
            <SectionHeader title="User Management" sub={`${users.length} users — click any row to view full details`} />

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input
                        placeholder="Search name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 12, border: '1px solid #eeedeb', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #eeedeb', background: '#fff', fontSize: '0.88rem', fontFamily: 'inherit', color: '#1a1c19' }}>
                    <option value="">All Roles</option>
                    {['farmer', 'expert', 'seller', 'grc', 'admin'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
            </div>

            {loading ? (
                <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading users...</div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8faf8' }}>
                                {HEADERS.map(h => (
                                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #eeedeb' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#aaa', fontWeight: 700 }}>No users found</td></tr>
                            )}
                            {users.map(u => (
                                <tr key={u.id}
                                    style={{ borderBottom: '1px solid #f4f4f2', cursor: 'pointer', transition: 'background 0.12s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8faf8'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => onSelectUser(u)}
                                >
                                    <td style={{ padding: '13px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#2d5a27', fontSize: '0.9rem', border: '1px solid #bbf7d0', flexShrink: 0 }}>
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1a1c19' }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: '#666' }}>{u.email}</td>
                                    <td style={{ padding: '13px 16px' }}><StatusBadge status={u.role} /></td>
                                    <td style={{ padding: '13px 16px' }}><StatusBadge status={u.status} /></td>
                                    <td style={{ padding: '13px 16px', fontWeight: 900, color: '#2d5a27', fontSize: '0.95rem' }}>{u.sustainability_score}</td>
                                    <td style={{ padding: '13px 16px', fontWeight: 800, color: '#d4af37', fontSize: '0.88rem' }}>{u.badges_count}</td>
                                    <td style={{ padding: '13px 16px', fontWeight: 800, color: '#7c3aed', fontSize: '0.88rem' }}>{u.missions_completed}</td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <ChevronRight size={16} color="#aaa" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ─── PROOFS TAB ───────────────────────────────────────────────
export const ProofsTab = () => {
    const [proofs, setProofs] = useState([]);
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState('');
    const [deductPts, setDeductPts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1').replace('/api/v1', '');

    useEffect(() => {
        adminFetch('/admin/proofs?status=pending_review&limit=50')
            .then(d => { setProofs(d.proofs || []); setLoading(false); })
            .catch(console.error);
    }, []);

    const handleAction = async (action) => {
        setSubmitting(true);
        try {
            await adminFetch(`/admin/proofs/${selected.id}/action`, {
                method: 'POST',
                body: JSON.stringify({ action, reason, deduct_points: Number(deductPts) })
            });
            setProofs(p => p.filter(x => x.id !== selected.id));
            setSelected(null);
            setReason('');
            setDeductPts(0);
        } catch (e) { alert(e.message); }
        finally { setSubmitting(false); }
    };

    return (
        <div>
            <SectionHeader title="Proof Review" sub="Verify farming proof submissions — approve genuine work or reject fake uploads" />

            {loading ? (
                <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading proofs...</div>
            ) : proofs.length === 0 ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: 60, textAlign: 'center' }}>
                    <CheckCircle size={36} color="#16a34a" style={{ marginBottom: 12 }} />
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '1rem' }}>All caught up</div>
                    <div style={{ color: '#888', marginTop: 6, fontSize: '0.85rem' }}>No proofs pending review</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
                    {proofs.map(p => (
                        <div key={p.id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'}>
                            {p.file_url ? (
                                <img src={`${baseUrl}${p.file_url}`} alt="proof" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                                <div style={{ height: 100, background: '#f8faf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.82rem' }}>No image</div>
                            )}
                            <div style={{ padding: '16px 18px' }}>
                                <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 4 }}>{p.farmer_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 12 }}>{new Date(p.submitted_at).toLocaleString()}</div>
                                {p.ai_result && (
                                    <div style={{ background: p.ai_result.manipulation_detected ? '#fef2f2' : '#f0fdf4', border: `1px solid ${p.ai_result.manipulation_detected ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: p.ai_result.manipulation_detected ? '#dc2626' : '#166534' }}>
                                        {p.ai_result.manipulation_detected
                                            ? <><AlertTriangle size={13} /> AI flagged manipulation</>
                                            : <><CheckCircle size={13} /> AI: {Math.round(p.ai_result.confidence_score * 100)}% real</>
                                        }
                                    </div>
                                )}
                                <button onClick={() => setSelected(p)} style={{ width: '100%', padding: '10px', background: '#2d5a27', border: 'none', borderRadius: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
                                    onMouseEnter={e => e.target.style.opacity = '0.85'}
                                    onMouseLeave={e => e.target.style.opacity = '1'}>
                                    Review Proof
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {selected && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setSelected(null)}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eeedeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>Review Proof — {selected.farmer_name}</div>
                            <button onClick={() => setSelected(null)} style={{ border: 'none', background: '#f4f4f2', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                        </div>
                        <div style={{ padding: 24 }}>
                            {selected.file_url && <img src={`${baseUrl}${selected.file_url}`} alt="proof" style={{ width: '100%', borderRadius: 14, marginBottom: 20, maxHeight: 260, objectFit: 'cover', display: 'block' }} />}
                            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Notes / Reason</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Enter notes for this decision..."
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #eeedeb', resize: 'none', outline: 'none', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.88rem' }} />
                            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Points to Deduct (if rejecting)</label>
                            <input type="number" value={deductPts} onChange={e => setDeductPts(e.target.value)} min={0} max={500}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #eeedeb', outline: 'none', marginBottom: 20, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => handleAction('approve')} disabled={submitting}
                                    style={{ flex: 1, padding: '12px', background: '#f0fdf4', border: '1px solid #4ade80', borderRadius: 14, fontWeight: 900, color: '#166534', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button onClick={() => handleAction('reject')} disabled={submitting}
                                    style={{ flex: 1, padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, fontWeight: 900, color: '#dc2626', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                                    <XCircle size={16} /> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
