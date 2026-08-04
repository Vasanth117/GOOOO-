import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, FileCheck, AlertTriangle,
    Leaf, Trophy, Gift, Award, Bell
} from 'lucide-react';

const ADMIN_API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1';

export const adminFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('access_token');
    const isFormData = options.body instanceof FormData;
    const res = await fetch(`${ADMIN_API}${endpoint}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || 'Request failed');
    return data.data;
};

// ─── STAT CARD ────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, color = '#2d5a27', sub, onClick }) => (
    <div onClick={onClick} style={{
        background: '#fff', borderRadius: 20, padding: '22px 24px',
        border: '1px solid #eeedeb', boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.2s',
    }}
        onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                {sub && <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: 1 }}>{sub}</div>}
            </div>
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 950, color: '#1a1c19', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value ?? '—'}</div>
    </div>
);

// ─── STATUS BADGE ─────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
    const map = {
        active:         { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
        banned:         { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
        pending:        { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
        approved:       { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
        rejected:       { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
        open:           { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
        resolved:       { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
        dismissed:      { bg: '#f4f4f2', color: '#666',    border: '#e5e5e5' },
        pending_review: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
        pending_ai:     { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
        farmer:         { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
        admin:          { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
        grc:            { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
        expert:         { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
        seller:         { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
        high:           { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
        medium:         { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
        low:            { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
        critical:       { bg: '#fff0f0', color: '#9b1c1c', border: '#fca5a5' },
    };
    const c = map[status] || { bg: '#f4f4f2', color: '#666', border: '#e5e5e5' };
    return (
        <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, textTransform: 'capitalize', display: 'inline-block' }}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
};

// ─── SECTION HEADER ──────────────────────────────────────────
export const SectionHeader = ({ title, sub, action }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
            <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 950, color: '#1a1c19' }}>{title}</h2>
            {sub && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>{sub}</p>}
        </div>
        {action}
    </div>
);

// ─── PRIMARY BUTTON ───────────────────────────────────────────
export const PrimaryBtn = ({ label, onClick, icon: Icon, danger, small }) => (
    <button onClick={onClick} style={{
        padding: small ? '7px 14px' : '10px 22px',
        background: danger ? '#fef2f2' : '#2d5a27',
        color: danger ? '#dc2626' : '#fff',
        border: danger ? '1px solid #fecaca' : 'none',
        borderRadius: 12, fontWeight: 800, cursor: 'pointer',
        fontSize: small ? '0.78rem' : '0.88rem',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontFamily: 'inherit',
    }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = danger ? '0 4px 12px rgba(220,38,38,0.2)' : '0 4px 12px rgba(45,90,39,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
        {Icon && <Icon size={small ? 13 : 15} />}
        {label}
    </button>
);

// ─── OVERVIEW TAB ─────────────────────────────────────────────
export const OverviewTab = ({ stats }) => {
    if (!stats) return <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading platform statistics...</div>;
    const cards = [
        { icon: Users,         label: 'Total Users',       value: stats.total_users,               color: '#2d5a27' },
        { icon: Leaf,          label: 'Farmers',            value: stats.total_farmers,             color: '#16a34a' },
        { icon: FileCheck,     label: 'Proofs Submitted',   value: stats.total_proofs_submitted,    color: '#0891b2' },
        { icon: FileCheck,     label: 'Pending Proofs',     value: stats.pending_proofs,            color: '#d97706', sub: 'Needs review' },
        { icon: Award,         label: 'Missions Done',      value: stats.total_missions_completed,  color: '#7c3aed' },
        { icon: Bell,          label: 'GRC Members',        value: stats.total_grc_members,         color: '#f59e0b' },
        { icon: Trophy,        label: 'Total Farms',        value: stats.total_farms,               color: '#059669' },
        { icon: AlertTriangle, label: 'Open Fraud Flags',   value: stats.open_fraud_flags,          color: '#dc2626', sub: 'Urgent' },
        { icon: Gift,          label: 'Avg Score',          value: stats.average_sustainability_score, color: '#d4af37', sub: 'Sustainability' },
    ];
    return (
        <div>
            <SectionHeader title="Platform Overview" sub="Live statistics across the entire GOO ecosystem" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 14 }}>
                {cards.map(({ icon, label, value, color, sub }) => (
                    <StatCard key={label} icon={icon} label={label} value={value} color={color} sub={sub} />
                ))}
            </div>
        </div>
    );
};

