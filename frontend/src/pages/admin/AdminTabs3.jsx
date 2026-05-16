import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Star, Bell, AlertTriangle, FileCheck } from 'lucide-react';
import { adminFetch, SectionHeader } from './adminUtils';

// ─── SHARED FIELD ─────────────────────────────────────────────
const Field = ({ label, children }) => (
    <div>
        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>{label}</label>
        {children}
    </div>
);

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #eeedeb', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1c19', transition: 'border-color 0.15s' };

// ─── REWARDS / VOUCHERS TAB ───────────────────────────────────
export const RewardsTab = () => {
    const [vouchers, setVouchers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', points_cost: 100, discount_percent: '', category: 'general', expiry_days: 30 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const load = () => { adminFetch('/admin/rewards/vouchers?limit=50').then(d => { setVouchers(d.vouchers || []); setLoading(false); }).catch(console.error); };
    useEffect(() => { load(); }, []);

    const create = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await adminFetch('/admin/rewards/vouchers', {
                method: 'POST',
                body: JSON.stringify({ ...form, points_cost: Number(form.points_cost), discount_percent: form.discount_percent ? Number(form.discount_percent) : null, expiry_days: Number(form.expiry_days) })
            });
            setShowForm(false);
            setForm({ title: '', description: '', points_cost: 100, discount_percent: '', category: 'general', expiry_days: 30 });
            load();
        } catch (e) { alert(e.message); }
        finally { setSubmitting(false); }
    };

    const remove = async (id) => {
        if (!confirm('Delete this voucher?')) return;
        try { await adminFetch(`/admin/rewards/vouchers/${id}`, { method: 'DELETE' }); load(); }
        catch (e) { alert(e.message); }
    };

    return (
        <div>
            <SectionHeader title="Rewards & Vouchers" sub="Create vouchers that farmers can redeem with their points"
                action={
                    <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                        <Plus size={15} /> New Voucher
                    </button>
                }
            />

            {showForm && (
                <form onSubmit={create} style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', padding: 28, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 20, fontFamily: 'Outfit, sans-serif' }}>Create New Voucher</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <Field label="Title">
                            <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 10% Seed Discount" required />
                        </Field>
                        <Field label="Category">
                            <input style={inputStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="general / seeds / tools" />
                        </Field>
                        <Field label="Points Cost">
                            <input type="number" style={inputStyle} value={form.points_cost} onChange={e => setForm(p => ({ ...p, points_cost: e.target.value }))} required />
                        </Field>
                        <Field label="Discount %">
                            <input type="number" style={inputStyle} value={form.discount_percent} onChange={e => setForm(p => ({ ...p, discount_percent: e.target.value }))} placeholder="Optional" />
                        </Field>
                        <Field label="Expiry (days)">
                            <input type="number" style={inputStyle} value={form.expiry_days} onChange={e => setForm(p => ({ ...p, expiry_days: e.target.value }))} />
                        </Field>
                    </div>
                    <Field label="Description">
                        <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the voucher benefit..." />
                    </Field>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <button type="submit" disabled={submitting} style={{ padding: '10px 24px', background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {submitting ? 'Creating...' : 'Create Voucher'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f4f4f2', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading vouchers...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
                    {vouchers.length === 0 && <div style={{ color: '#888', textAlign: 'center', padding: 60, gridColumn: '1/-1', fontWeight: 700 }}>No vouchers created yet</div>}
                    {vouchers.map(v => (
                        <div key={v.id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', padding: 22, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Tag size={18} color="#2d5a27" />
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: v.is_redeemed ? '#fef2f2' : '#f0fdf4', color: v.is_redeemed ? '#dc2626' : '#166534', padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {v.is_redeemed ? 'Redeemed' : 'Available'}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a1c19', marginBottom: 3 }}>{v.description}</div>
                                <div style={{ fontSize: '0.78rem', color: '#888' }}>{v.metadata?.category || 'general'} · {v.metadata?.expiry_days || 30} days</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontWeight: 950, color: '#2d5a27', fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>{v.points_cost}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: 4 }}>pts</span>
                                </div>
                                {v.metadata?.discount_percent && (
                                    <span style={{ background: '#fffbeb', color: '#d97706', padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800 }}>{v.metadata.discount_percent}% OFF</span>
                                )}
                            </div>
                            <button onClick={() => remove(v.id)} style={{ padding: '9px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, fontWeight: 800, color: '#dc2626', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                                <Trash2 size={13} /> Delete Voucher
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── BADGES TAB ───────────────────────────────────────────────
export const BadgesTab = () => {
    const [badges, setBadges] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', icon: '★', tier: 'beginner', condition_type: 'manual', condition_value: 0 });
    const [submitting, setSubmitting] = useState(false);

    const load = () => { adminFetch('/admin/rewards/badges').then(d => setBadges(d.badges || [])).catch(console.error); };
    useEffect(() => { load(); }, []);

    const create = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try { await adminFetch('/admin/rewards/badges', { method: 'POST', body: JSON.stringify({ ...form, condition_value: Number(form.condition_value) }) }); setShowForm(false); load(); }
        catch (e) { alert(e.message); }
        finally { setSubmitting(false); }
    };

    const remove = async (id) => {
        if (!confirm('Delete this badge?')) return;
        try { await adminFetch(`/admin/rewards/badges/${id}`, { method: 'DELETE' }); load(); }
        catch (e) { alert(e.message); }
    };

    const tierColors = { beginner: '#16a34a', intermediate: '#1d4ed8', advanced: '#7c3aed', expert: '#d97706', special: '#d4af37' };

    return (
        <div>
            <SectionHeader title="Badge Management" sub="Define achievement badges farmers can earn"
                action={
                    <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                        <Plus size={15} /> New Badge
                    </button>
                }
            />

            {showForm && (
                <form onSubmit={create} style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', padding: 28, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 20, fontFamily: 'Outfit, sans-serif' }}>Create Badge</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <Field label="Badge Name"><input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Water Saver" required /></Field>
                        <Field label="Icon (symbol)"><input style={inputStyle} value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="★ or any symbol" /></Field>
                        <Field label="Tier">
                            <select style={inputStyle} value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))}>
                                {['beginner', 'intermediate', 'advanced', 'expert', 'special'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </Field>
                        <Field label="Condition Type"><input style={inputStyle} value={form.condition_type} onChange={e => setForm(p => ({ ...p, condition_type: e.target.value }))} placeholder="score_threshold / streak / missions" /></Field>
                        <Field label="Condition Value"><input type="number" style={inputStyle} value={form.condition_value} onChange={e => setForm(p => ({ ...p, condition_value: e.target.value }))} /></Field>
                    </div>
                    <Field label="Description">
                        <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What earns this badge?" />
                    </Field>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <button type="submit" disabled={submitting} style={{ padding: '10px 24px', background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{submitting ? 'Creating...' : 'Create Badge'}</button>
                        <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f4f4f2', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {badges.length === 0 && <div style={{ color: '#888', textAlign: 'center', padding: 60, gridColumn: '1/-1', fontWeight: 700 }}>No badges defined yet</div>}
                {badges.map(b => {
                    const c = tierColors[b.tier] || '#888';
                    return (
                        <div key={b.id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', padding: 22, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: `2px solid ${c}30` }}>
                                <Star size={24} color={c} />
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 4 }}>{b.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 10, lineHeight: 1.4 }}>{b.description}</div>
                            <span style={{ background: `${c}18`, color: c, padding: '4px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 900, textTransform: 'capitalize', display: 'inline-block', marginBottom: 14 }}>{b.tier}</span>
                            <button onClick={() => remove(b.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, fontWeight: 800, color: '#dc2626', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                                <Trash2 size={13} /> Delete
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── ALERTS TAB ───────────────────────────────────────────────
export const AlertsTab = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch('/admin/notifications?limit=50')
            .then(d => { setAlerts(d.alerts || []); setLoading(false); })
            .catch(console.error);
    }, []);

    const typeConfig = {
        fraud_flag:    { icon: AlertTriangle, bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
        pending_proof: { icon: FileCheck,     bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    };

    return (
        <div>
            <SectionHeader title="Admin Alerts" sub="Fraud flags and proof submissions requiring your attention" />
            {loading ? (
                <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading alerts...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alerts.length === 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: 60, textAlign: 'center' }}>
                            <Bell size={36} color="#16a34a" style={{ marginBottom: 12 }} />
                            <div style={{ fontWeight: 800, color: '#166534' }}>All clear — no alerts</div>
                        </div>
                    )}
                    {alerts.map((a, i) => {
                        const cfg = typeConfig[a.type] || { icon: Bell, bg: '#f8faf8', border: '#eeedeb', color: '#666' };
                        const Icon = cfg.icon;
                        return (
                            <div key={i} style={{ background: cfg.bg, borderRadius: 14, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${cfg.border}` }}>
                                <div style={{ width: 38, height: 38, borderRadius: 11, background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} color={cfg.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a1c19', marginBottom: 2 }}>{a.message}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600 }}>{new Date(a.created_at).toLocaleString()}</div>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 900, background: a.severity === 'high' ? '#fecaca' : '#dbeafe', color: a.severity === 'high' ? '#dc2626' : '#1d4ed8', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                                    {a.severity}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
