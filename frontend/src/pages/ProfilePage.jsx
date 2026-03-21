import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, MapPin, Award, Droplets, Leaf, Zap, Star,
    Settings, Edit3, Share2, CheckCircle2, TrendingUp,
    Trophy, Globe, ChevronRight, ShieldCheck, Mail,
    Grid, History, PieChart, MessageSquare, Flame,
    ArrowUpRight, Bot, Sprout, Beaker, AlertCircle,
    Loader2, Camera, Save, X, Navigation, Clock,
    Droplet, Wind, Sun, Package, RefreshCw, Phone,
    Activity, BarChart2, Target, Users, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import cover from '../assets/images/1.jpg';

const TABS = [
    { id: 'Overview', icon: Grid, label: 'Overview' },
    { id: 'Activity', icon: Activity, label: 'Activity' },
    { id: 'Achievements', icon: Trophy, label: 'Achievements' },
    { id: 'Analytics', icon: BarChart2, label: 'Analytics' },
];
const API_BASE = 'http://localhost:8000';

const ProfilePage = () => {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('Overview');
    const [profile, setProfile] = useState(null);
    const [missionHistory, setMissionHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '', phone: '' });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [locationName, setLocationName] = useState('');
    const fileRef = useRef();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = async () => {
        try {
            const [data, history] = await Promise.all([
                apiService.getProfile(),
                apiService.getMissionHistory().catch(() => ({ missions: [] }))
            ]);
            setProfile(data);
            setEditForm({ name: data.name || '', bio: data.bio || '', phone: data.phone || '' });
            setMissionHistory(history?.missions || []);

            // Resolve location name from coordinates
            const loc = data?.farm?.location;
            if (loc?.latitude && loc?.longitude) {
                try {
                    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json`);
                    const j = await r.json();
                    setLocationName(j.address?.city || j.address?.town || j.address?.village || j.address?.state || 'Unknown Location');
                } catch { setLocationName('Location detected'); }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    const detectLocation = () => {
        if (!navigator.geolocation) return showToast('Geolocation not supported.', 'error');
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    // Save to farm profile
                    await apiService.updateFarm({ location: { latitude, longitude } });
                    // Reverse geocode
                    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const j = await r.json();
                    const name = j.address?.city || j.address?.town || j.address?.village || j.address?.state || 'Location detected';
                    setLocationName(name);
                    showToast(`📍 Location set to ${name}`);
                    loadData();
                } catch { showToast('Location detected but could not save.', 'error'); }
                finally { setLocationLoading(false); }
            },
            (err) => {
                setLocationLoading(false);
                showToast('Could not access your location. Please enable permissions.', 'error');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('bio', editForm.bio);
            formData.append('phone', editForm.phone);
            if (avatarFile) formData.append('avatar', avatarFile);
            const res = await apiService.updateProfile(formData);
            if (res?.status === 'success' || res?.name || res?.id) {
                await refreshUser();
                await loadData();
                setEditing(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                showToast('Profile updated! ✅');
            } else {
                showToast(res?.message || 'Failed to save.', 'error');
            }
        } catch (e) {
            showToast('Error saving profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getAvatarUrl = () => {
        if (avatarPreview) return avatarPreview;
        if (profile?.profile_picture) return `${API_BASE}${profile.profile_picture}`;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=2d5a27&color=fff&size=200`;
    };

    if (loading) return (
        <div className="profile-loading-screen">
            <Loader2 size={40} className="spin-anim" style={{ color: '#2d5a27' }} />
            <p>Loading your profile…</p>
        </div>
    );

    const farm = profile?.farm || {};
    const stats = profile?.stats || {};
    const loc = farm.location;

    const IMPACT = [
        { label: 'Total Score', val: stats.total_score || 0, icon: Zap, color: '#d4af37', bg: '#fffbeb' },
        { label: 'Tasks Done', val: stats.tasks_completed || 0, icon: CheckCircle2, color: '#2d5a27', bg: '#f0fdf4' },
        { label: 'Eco Streak', val: `${stats.streak_current || 0}d`, icon: Flame, color: '#e63946', bg: '#fff1f2' },
    ];

    const BADGES = [
        { name: 'Eco Warrior', color: '#3b82f6', bg: '#eff6ff', icon: Droplets, condition: (stats.tasks_completed || 0) >= 10, hint: 'Complete 10 tasks' },
        { name: 'Soil Master', color: '#92400e', bg: '#fef3c7', icon: Sprout, condition: !!farm.soil_type, hint: 'Set your soil type in Settings' },
        { name: 'Streak Champion', color: '#e63946', bg: '#fff1f2', icon: Flame, condition: (stats.streak_current || 0) >= 7, hint: `${stats.streak_current || 0}/7 days` },
        { name: 'Bio Genius', color: '#2d5a27', bg: '#f0fdf4', icon: Beaker, condition: !!profile?.bio, hint: 'Add a bio to unlock' },
        { name: 'Market Seller', color: '#7c3aed', bg: '#f5f3ff', icon: Package, condition: false, hint: 'List a product in the Marketplace' },
        { name: 'Organic Pioneer', color: '#d4af37', bg: '#fffbeb', icon: Star, condition: (farm.sustainability_score || 0) >= 70, hint: `Score: ${farm.sustainability_score || 0}/70` },
    ];

    return (
        <div className="profile-page-wrapper">

            {/* ── TOAST ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div className={`profile-toast ${toast.type}`}
                        initial={{ opacity: 0, y: -30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}>
                        {toast.type !== 'error' && <CheckCircle2 size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── EDIT MODAL ── */}
            <AnimatePresence>
                {editing && (
                    <motion.div className="profile-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(false)}>
                        <motion.div className="profile-edit-modal" initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                            <div className="pem-header">
                                <h3>Edit Profile</h3>
                                <button className="pem-close" onClick={() => setEditing(false)}><X size={20} /></button>
                            </div>

                            <div className="pem-avatar-row">
                                <div className="pem-avatar-wrap">
                                    <img src={getAvatarUrl()} alt="avatar" />
                                    <button className="pem-cam-btn" onClick={() => fileRef.current.click()}><Camera size={16} /></button>
                                </div>
                                <div>
                                    <p className="pem-name">{editForm.name || profile?.name}</p>
                                    <p className="pem-role">{profile?.role || 'Farmer'}</p>
                                    <button className="pem-upload-btn" onClick={() => fileRef.current.click()}><Camera size={14}/> Change Photo</button>
                                </div>
                                <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => {
                                    const f = e.target.files[0];
                                    if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                                }} />
                            </div>

                            <div className="pem-fields">
                                <div className="pem-field">
                                    <label>Full Name</label>
                                    <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} placeholder="Your name..." />
                                </div>
                                <div className="pem-field">
                                    <label>Phone Number</label>
                                    <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 43210" />
                                </div>
                                <div className="pem-field">
                                    <label>Bio</label>
                                    <textarea rows={3} value={editForm.bio} onChange={e => setEditForm(p => ({...p, bio: e.target.value}))} placeholder="Tell your farming story..." />
                                </div>
                            </div>

                            <button className="pem-save-btn" onClick={handleSaveProfile} disabled={saving}>
                                {saving ? <Loader2 size={18} className="spin-anim" /> : <Save size={18} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── COVER HERO ── */}
            <div className="profile-hero-section">
                <div className="profile-cover" style={{ backgroundImage: `url(${cover})` }}>
                    <div className="profile-cover-overlay" />
                    <div className="profile-cover-actions">
                        <button className="pca-btn"><Share2 size={18} /></button>
                        <button className="pca-btn"><Settings size={18} /></button>
                    </div>
                </div>

                {/* Identity Card */}
                <div className="profile-identity-card">
                    <div className="pic-left">
                        <div className="profile-avatar-wrap">
                            <img src={getAvatarUrl()} alt={profile?.name} className="profile-avatar-img" />
                            <div className="profile-rank-badge"><Trophy size={14} /></div>
                        </div>
                        <div className="profile-identity-info">
                            <div className="pin-name-row">
                                <h1>{profile?.name}</h1>
                                {profile?.is_verified && <ShieldCheck size={20} color="#2d5a27" />}
                                <span className="pin-role-tag">{profile?.role || 'Farmer'}</span>
                            </div>
                            <div className="pin-meta-row">
                                <span>@{(profile?.name || 'user').toLowerCase().replace(/\s+/g, '_')}</span>
                                <span className="pin-sep">•</span>
                                <span className="pin-location-chip">
                                    <MapPin size={13} />
                                    {locationName || (loc ? `${loc.latitude?.toFixed(2)}°, ${loc.longitude?.toFixed(2)}°` : 'Location not set')}
                                </span>
                                <button className="pin-detect-btn" onClick={detectLocation} disabled={locationLoading} title="Auto-detect my location">
                                    {locationLoading ? <Loader2 size={13} className="spin-anim" /> : <Navigation size={13} />}
                                    {locationLoading ? 'Detecting...' : 'Detect'}
                                </button>
                            </div>
                            <p className="pin-bio">{profile?.bio || 'No bio yet. Click Edit Profile to add one.'}</p>
                        </div>
                    </div>
                    <div className="pic-right">
                        <button className="btn-edit-profile" onClick={() => setEditing(true)}>
                            <Edit3 size={16} /> Edit Profile
                        </button>
                        <button className="btn-refresh-profile" onClick={loadData} title="Refresh data">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="profile-stats-bar">
                    {[
                        { label: 'GOO Score', val: stats.total_score || 0 },
                        { label: 'Tasks', val: stats.tasks_completed || 0 },
                        { label: 'Streak', val: `${stats.streak_current || 0}d` },
                        { label: 'Farm Acres', val: farm.farm_size_acres || '—' },
                        { label: 'Rank', val: stats.rank || '#—' },
                    ].map((s, i) => (
                        <div key={i} className="psb-item">
                            <strong>{s.val}</strong>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="profile-tab-nav">
                {TABS.map(tab => (
                    <button key={tab.id}
                        className={`profile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        <tab.icon size={16} />
                        {tab.label}
                        {activeTab === tab.id && <motion.div className="profile-tab-line" layoutId="ptab" />}
                    </button>
                ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="profile-content-area">
                <AnimatePresence mode="wait">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'Overview' && (
                        <motion.div key="ov" className="profile-overview-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                            <div className="pov-col">
                                {/* Sustainability */}
                                <div className="profile-card">
                                    <div className="pcard-header">
                                        <div className="pcard-title"><Leaf size={18} color="#2d5a27" /><h3>Sustainability Score</h3></div>
                                        <span className="live-chip"><span className="live-dot" />Live</span>
                                    </div>
                                    <div className="sustainability-display">
                                        <div className="sust-num">{farm.sustainability_score || 0}</div>
                                        <div className="sust-label">{farm.farming_practices || 'Conventional'} Farmer</div>
                                    </div>
                                    <div className="sust-bar-bg">
                                        <motion.div className="sust-bar-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(farm.sustainability_score || 0, 100)}%` }}
                                            transition={{ duration: 1.5, ease: 'easeOut' }} />
                                    </div>
                                    <div className="sust-scale"><span>0</span><span>50</span><span>100</span></div>
                                </div>

                                {/* Impact Metrics */}
                                <div className="profile-impact-row">
                                    {IMPACT.map(item => (
                                        <div key={item.label} className="profile-impact-card" style={{ '--ic-color': item.color, '--ic-bg': item.bg }}>
                                            <item.icon size={22} color={item.color} />
                                            <div className="ic-val">{item.val}</div>
                                            <div className="ic-label">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Insights */}
                                <div className="profile-card">
                                    <div className="pcard-header"><div className="pcard-title"><Bot size={18} color="#6366f1" /><h3>AI Personal Advice</h3></div></div>
                                    <div className="ai-advice-list">
                                        <div className="ai-advice-item"><CheckCircle2 size={14} color="#2d5a27" /><p>Your farm uses <strong>{farm.soil_type || 'unknown'}</strong> soil — perfect for legume rotation to boost sustainability.</p></div>
                                        <div className="ai-advice-item"><CheckCircle2 size={14} color="#2d5a27" /><p>Irrigation type: <strong>{farm.irrigation_type || 'not set'}</strong>. Drip irrigation can save up to 40% water!</p></div>
                                        {!loc && <div className="ai-advice-item warning"><AlertCircle size={14} color="#f97316" /><p>Enable location to get hyper-local weather and crop advice.</p></div>}
                                    </div>
                                </div>
                            </div>

                            <div className="pov-col">
                                {/* Farm Passport */}
                                <div className="profile-card">
                                    <h3 className="pcard-section-title">🌾 Farm Passport</h3>
                                    <div className="farm-passport-grid">
                                        {[
                                            ['Farm Name', farm.farm_name],
                                            ['Size', farm.farm_size_acres ? `${farm.farm_size_acres} Acres` : undefined],
                                            ['Soil Type', farm.soil_type],
                                            ['Irrigation', farm.irrigation_type],
                                            ['Crops', farm.crop_types?.join(', ')],
                                            ['Practice', farm.farming_practices],
                                            ['Location', locationName || (loc ? 'Detected' : undefined)],
                                            ['Phone', profile?.phone],
                                        ].map(([label, val]) => (
                                            <div key={label} className="fpp-item">
                                                <span>{label}</span>
                                                <strong>{val || <span className="fpp-empty">Not set</span>}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Streak */}
                                <div className="profile-card streak-card">
                                    <div className="streak-top">
                                        <Flame size={28} color="#e63946" />
                                        <div>
                                            <div className="streak-num">{stats.streak_current || 0} Days</div>
                                            <div className="streak-sub">Active Eco-Streak</div>
                                        </div>
                                    </div>
                                    <div className="streak-longest">🏆 Longest streak: <strong>{stats.streak_longest || 0} days</strong></div>
                                    <div className="streak-week">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className={`streak-dot ${i < (stats.streak_current % 7 || 0) ? 'active' : ''}`} />
                                        ))}
                                    </div>
                                </div>

                                {/* Green Club */}
                                <div className="profile-card green-club-card">
                                    <ShieldCheck size={36} color="#d4af37" />
                                    <h3>Green Revolution Club</h3>
                                    <p>Member since <strong>{new Date(profile?.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong></p>
                                    <div className={`verified-chip ${profile?.is_verified ? 'yes' : 'no'}`}>
                                        {profile?.is_verified ? '✅ Verified Validator' : '⏳ Awaiting Verification'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ACTIVITY TAB */}
                    {activeTab === 'Activity' && (
                        <motion.div key="ac" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="activity-tab-wrapper">
                                <div className="activity-header-row">
                                    <h2>Mission Activity Feed</h2>
                                    <span className="activity-count">{missionHistory.length} entries</span>
                                </div>
                                {missionHistory.length === 0 ? (
                                    <div className="activity-empty">
                                        <Target size={48} color="#ccc" />
                                        <h3>No Activity Yet</h3>
                                        <p>Complete missions to see your farming history here in real-time.</p>
                                    </div>
                                ) : (
                                    <div className="activity-timeline">
                                        {missionHistory.map((m, i) => (
                                            <div key={m.id || i} className="activity-event">
                                                <div className="ae-dot"><CheckCircle2 size={16} color="#2d5a27" /></div>
                                                <div className="ae-content">
                                                    <div className="ae-title">{m.title || m.mission_title || 'Mission Completed'}</div>
                                                    <div className="ae-meta">
                                                        <Clock size={12} /> {new Date(m.completed_at || m.started_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        {m.points_earned && <span className="ae-pts">+{m.points_earned} pts</span>}
                                                    </div>
                                                    {m.category && <span className="ae-tag">{m.category}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ACHIEVEMENTS TAB */}
                    {activeTab === 'Achievements' && (
                        <motion.div key="ac2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="achievements-wrapper">
                                <div className="ach-header">
                                    <h2>Badges & Achievements</h2>
                                    <span className="ach-count">{BADGES.filter(b => b.condition).length}/{BADGES.length} Unlocked</span>
                                </div>
                                <div className="badge-gallery-grid">
                                    {BADGES.map((badge, i) => (
                                        <motion.div key={i}
                                            className={`badge-card ${badge.condition ? 'unlocked' : 'locked'}`}
                                            style={{ '--badge-color': badge.color, '--badge-bg': badge.bg }}
                                            whileHover={{ y: -5 }}>
                                            <div className="badge-icon-circle">
                                                <badge.icon size={28} color={badge.condition ? badge.color : '#ccc'} />
                                            </div>
                                            <div className="badge-name">{badge.name}</div>
                                            <div className="badge-status">
                                                {badge.condition
                                                    ? <><CheckCircle2 size={12} color="#2d5a27" /> Unlocked</>
                                                    : <><Lock size={12} color="#aaa" /> {badge.hint}</>
                                                }
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Progress tracker */}
                                <div className="ach-progress-card">
                                    <h3>Your Journey Progress</h3>
                                    <div className="ach-prog-bar-bg">
                                        <div className="ach-prog-bar-fill" style={{ width: `${(BADGES.filter(b => b.condition).length / BADGES.length) * 100}%` }} />
                                    </div>
                                    <p>{BADGES.filter(b => b.condition).length} of {BADGES.length} badges earned. Keep farming!</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'Analytics' && (
                        <motion.div key="an" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="analytics-wrapper">
                                <h2>Live Farm Analytics</h2>
                                <div className="analytics-stat-grid">
                                    {[
                                        { label: 'Total GOO Score', val: stats.total_score || 0, icon: Zap, color: '#d4af37', desc: 'Lifetime eco-farming points' },
                                        { label: 'Tasks Completed', val: stats.tasks_completed || 0, icon: CheckCircle2, color: '#2d5a27', desc: 'Missions accomplished' },
                                        { label: 'Current Streak', val: `${stats.streak_current || 0}d`, icon: Flame, color: '#e63946', desc: 'Consecutive active days' },
                                        { label: 'Longest Streak', val: `${stats.streak_longest || 0}d`, icon: TrendingUp, color: '#7c3aed', desc: 'Personal best eco-streak' },
                                        { label: 'Sustainability', val: `${farm.sustainability_score || 0}%`, icon: Leaf, color: '#2d5a27', desc: 'Overall farm health score' },
                                        { label: 'Farm Size', val: farm.farm_size_acres ? `${farm.farm_size_acres} ac` : '—', icon: Globe, color: '#0ea5e9', desc: 'Total farming area' },
                                    ].map((s, i) => (
                                        <motion.div key={i} className="analytics-stat-card" style={{ '--asc-color': s.color }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
                                            <div className="asc-icon"><s.icon size={22} color={s.color} /></div>
                                            <div className="asc-body">
                                                <div className="asc-val">{s.val}</div>
                                                <div className="asc-label">{s.label}</div>
                                                <div className="asc-desc">{s.desc}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="analytics-info-strip">
                                    <RefreshCw size={14} color="#2d5a27" />
                                    Data refreshes automatically every 60 seconds • Last updated just now
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProfilePage;
