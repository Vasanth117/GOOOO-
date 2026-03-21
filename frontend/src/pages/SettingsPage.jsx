import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Lock, Bell, Globe, Bot, Shield,
    Database, LifeBuoy, Camera, Mail,
    LogOut, ChevronRight, Save,
    Smartphone, Download, HelpCircle,
    HardDrive, Trash2, Loader2, CheckCircle2,
    Eye, EyeOff, X, Navigation, MapPin,
    Leaf, Zap, AlertCircle, RefreshCw, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const SETTINGS_SECTIONS = [
    { id: 'account', label: 'Account & Profile', icon: User },
    { id: 'farm', label: 'Farm & Location', icon: Leaf },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'AI & Experience', icon: Bot },
    { id: 'data', label: 'Data & History', icon: Database },
    { id: 'support', label: 'Help & About', icon: LifeBuoy },
];

const API_BASE = 'http://localhost:8000';

const SettingsPage = () => {
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('account');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [locationName, setLocationName] = useState('');

    // Account
    const [accountForm, setAccountForm] = useState({ name: '', bio: '', phone: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Farm
    const [farmForm, setFarmForm] = useState({
        farm_name: '', farm_size_acres: '', soil_type: '',
        irrigation_type: '', crop_types: '', farming_practices: ''
    });

    // Password
    const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' });
    const [showPw, setShowPw] = useState(false);

    // Notifications
    const [notifSettings, setNotifSettings] = useState({
        push_notifications: true,
        mission_alerts: true,
        weather_alerts: true,
        ai_suggestions: true,
    });

    // AI Preferences
    const [aiPrefs, setAiPrefs] = useState({
        advice_priority: 'Organic Standards',
        language: 'English',
        ai_smart_suggestions: true,
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = async () => {
        try {
            const data = await apiService.getProfile();
            setProfile(data);
            setAccountForm({ name: data.name || '', bio: data.bio || '', phone: data.phone || '' });
            if (data.farm) {
                const f = data.farm;
                setFarmForm({
                    farm_name: f.farm_name || '',
                    farm_size_acres: f.farm_size_acres || '',
                    soil_type: f.soil_type || '',
                    irrigation_type: f.irrigation_type || '',
                    crop_types: f.crop_types?.join(', ') || '',
                    farming_practices: f.farming_practices || '',
                });
                const loc = f.location;
                if (loc?.latitude && loc?.longitude) {
                    try {
                        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json`);
                        const j = await r.json();
                        setLocationName(j.address?.city || j.address?.town || j.address?.village || j.address?.state || 'Location detected');
                    } catch { setLocationName('Location detected'); }
                }
            }
            if (data.preferences) {
                setNotifSettings(prev => ({ ...prev, ...data.preferences }));
                setAiPrefs(prev => ({ ...prev, ...data.preferences }));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const detectLocation = () => {
        if (!navigator.geolocation) return showToast('Geolocation is not supported by your browser.', 'error');
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    await apiService.updateFarm({ location: { latitude, longitude } });
                    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const j = await r.json();
                    const name = j.address?.city || j.address?.town || j.address?.village || j.address?.state || 'Your Location';
                    setLocationName(name);
                    showToast(`📍 Location set to ${name}`);
                    await loadData();
                } catch { showToast('Location detected but failed to save.', 'error'); }
                finally { setLocationLoading(false); }
            },
            () => {
                setLocationLoading(false);
                showToast('Could not detect location. Please allow browser permissions.', 'error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const saveAccountChanges = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', accountForm.name);
            formData.append('bio', accountForm.bio);
            formData.append('phone', accountForm.phone);
            if (avatarFile) formData.append('avatar', avatarFile);
            const res = await apiService.updateProfile(formData);
            if (res?.status === 'success' || res?.name || res?.id) {
                await refreshUser();
                setAvatarFile(null);
                setAvatarPreview(null);
                showToast('Account updated successfully! ✅');
                loadData();
            } else {
                showToast(res?.message || 'Failed to update.', 'error');
            }
        } catch (e) { showToast('Error saving account.', 'error'); }
        finally { setSaving(false); }
    };

    const saveFarmChanges = async () => {
        setSaving(true);
        try {
            const payload = {
                ...farmForm,
                farm_size_acres: parseFloat(farmForm.farm_size_acres) || 0,
                crop_types: farmForm.crop_types.split(',').map(s => s.trim()).filter(Boolean),
            };
            await apiService.updateFarm(payload);
            showToast('Farm details updated! 🌾');
            loadData();
        } catch (e) { showToast('Failed to save farm details.', 'error'); }
        finally { setSaving(false); }
    };

    const savePassword = async () => {
        if (pwForm.new !== pwForm.confirm) return showToast('Passwords do not match!', 'error');
        if (pwForm.new.length < 8) return showToast('New password must be at least 8 characters.', 'error');
        setSaving(true);
        try {
            await apiService.changePassword(pwForm.old, pwForm.new);
            setPwForm({ old: '', new: '', confirm: '' });
            showToast('Password changed successfully! 🔒');
        } catch (e) { showToast(e.message || 'Failed to change password.', 'error'); }
        finally { setSaving(false); }
    };

    const saveNotifications = async () => {
        setSaving(true);
        try {
            await apiService.updatePreferences(notifSettings);
            showToast('Notification preferences saved!');
        } catch { showToast('Failed to save.', 'error'); }
        finally { setSaving(false); }
    };

    const saveAIPrefs = async () => {
        setSaving(true);
        try {
            await apiService.updatePreferences(aiPrefs);
            showToast('AI preferences saved! The advisor will use these next session.');
        } catch { showToast('Failed to save.', 'error'); }
        finally { setSaving(false); }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getAvatarUrl = () => {
        if (avatarPreview) return avatarPreview;
        if (profile?.profile_picture) return `${API_BASE}${profile.profile_picture}`;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=2d5a27&color=fff&size=100`;
    };

    const Toggle = ({ value, onChange }) => (
        <div onClick={() => onChange(!value)} className={`settings-toggle ${value ? 'on' : 'off'}`}>
            <motion.div className="toggle-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
        </div>
    );

    const SectionHeader = ({ title, subtitle }) => (
        <div className="section-header-block">
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
        </div>
    );

    const SaveBtn = ({ onClick, label = 'Save Changes', disabled }) => (
        <button className="settings-save-btn" onClick={onClick} disabled={disabled || saving}>
            {saving ? <Loader2 size={16} className="spin-anim" /> : <Save size={16} />}
            {saving ? 'Saving...' : label}
        </button>
    );

    if (loading) return (
        <div className="settings-loading">
            <Loader2 size={36} className="spin-anim" style={{ color: '#2d5a27' }} />
            <p>Loading settings...</p>
        </div>
    );

    const farm = profile?.farm || {};
    const loc = farm.location;

    return (
        <div className="settings-page-layout">

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div className={`settings-toast ${toast.type}`}
                        initial={{ opacity: 0, y: -30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}>
                        {toast.type !== 'error' && <CheckCircle2 size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SIDEBAR ── */}
            <aside className="settings-sidebar">
                <div className="settings-user-card">
                    <img src={getAvatarUrl()} alt="avatar" className="settings-avatar" />
                    <div>
                        <h2>{profile?.name}</h2>
                        <p>{profile?.email}</p>
                        <span className={`settings-role-chip ${profile?.role}`}>{profile?.role || 'Farmer'}</span>
                    </div>
                </div>

                <nav className="settings-nav-list">
                    {SETTINGS_SECTIONS.map(sec => (
                        <button
                            key={sec.id}
                            className={`settings-nav-btn ${activeSection === sec.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(sec.id)}>
                            <sec.icon size={18} />
                            <span>{sec.label}</span>
                            {activeSection === sec.id && <ChevronRight size={14} className="snav-arrow" />}
                        </button>
                    ))}
                </nav>

                <button className="settings-logout-btn" onClick={handleLogout}>
                    <LogOut size={18} /> Sign Out
                </button>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="settings-main-content">
                <AnimatePresence mode="wait">

                    {/* ACCOUNT */}
                    {activeSection === 'account' && (
                        <motion.div key="account" className="settings-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <SectionHeader title="Account & Profile" subtitle="Manage your identity and personal information" />

                            <div className="settings-card">
                                <div className="settings-avatar-editor">
                                    <div className="sae-img-wrap">
                                        <img src={getAvatarUrl()} alt="Profile" />
                                        <label htmlFor="avatar-upload-s" className="sae-cam-btn"><Camera size={16} /></label>
                                        <input id="avatar-upload-s" type="file" hidden accept="image/*"
                                            onChange={e => { const f = e.target.files[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
                                    </div>
                                    <div>
                                        <h4>{profile?.name}</h4>
                                        <p>Click the camera icon to change your profile photo</p>
                                        {avatarPreview && <span className="sae-preview-label">✅ Ready to upload</span>}
                                    </div>
                                </div>

                                <div className="settings-input-grid">
                                    <div className="settings-field">
                                        <label>Full Name</label>
                                        <input type="text" value={accountForm.name} onChange={e => setAccountForm(p => ({...p, name: e.target.value}))} placeholder="Your full name" />
                                    </div>
                                    <div className="settings-field">
                                        <label>Email Address</label>
                                        <input type="email" value={profile?.email || ''} disabled className="disabled-input" />
                                    </div>
                                    <div className="settings-field">
                                        <label>Phone Number</label>
                                        <div className="settings-input-icon-wrap">
                                            <Phone size={16} className="sii-icon" />
                                            <input type="tel" value={accountForm.phone} onChange={e => setAccountForm(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 43210" />
                                        </div>
                                    </div>
                                </div>
                                <div className="settings-field" style={{ marginTop: 15 }}>
                                    <label>Bio / Farming Story</label>
                                    <textarea rows={3} value={accountForm.bio} onChange={e => setAccountForm(p => ({...p, bio: e.target.value}))} placeholder="Share your farming journey with the community..." />
                                </div>
                            </div>

                            <SaveBtn onClick={saveAccountChanges} />

                            <div className="settings-divider" />

                            {/* Change Password */}
                            <SectionHeader title="Change Password" subtitle="Use a strong password to protect your account" />
                            <div className="settings-card">
                                <div className="settings-input-grid">
                                    <div className="settings-field">
                                        <label>Current Password</label>
                                        <input type={showPw ? 'text' : 'password'} value={pwForm.old} onChange={e => setPwForm(p => ({...p, old: e.target.value}))} placeholder="Your current password" />
                                    </div>
                                    <div className="settings-field">
                                        <label>New Password</label>
                                        <input type={showPw ? 'text' : 'password'} value={pwForm.new} onChange={e => setPwForm(p => ({...p, new: e.target.value}))} placeholder="Min. 8 characters" />
                                    </div>
                                    <div className="settings-field">
                                        <label>Confirm New Password</label>
                                        <input type={showPw ? 'text' : 'password'} value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} placeholder="Repeat new password" />
                                    </div>
                                </div>
                                <div className="settings-btn-row">
                                    <button className="settings-outline-btn" onClick={() => setShowPw(!showPw)}>
                                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>} {showPw ? 'Hide' : 'Show'} Passwords
                                    </button>
                                    <SaveBtn onClick={savePassword} label="Change Password" disabled={!pwForm.old} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* FARM & LOCATION */}
                    {activeSection === 'farm' && (
                        <motion.div key="farm" className="settings-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <SectionHeader title="Farm & Location" subtitle="Set up your farm details and enable auto-location for hyper-local weather alerts and AI advice" />

                            {/* Location Panel */}
                            <div className="settings-card location-card">
                                <div className="loc-card-top">
                                    <div className="loc-icon-wrap"><MapPin size={22} color="#2d5a27" /></div>
                                    <div className="loc-info">
                                        <h4>Your Farm Location</h4>
                                        <p>
                                            {locationName
                                                ? <><strong>{locationName}</strong> (Auto-detected)</>
                                                : loc
                                                    ? <>{loc.latitude?.toFixed(4)}°N, {loc.longitude?.toFixed(4)}°E</>
                                                    : 'Location not set yet'
                                            }
                                        </p>
                                        {loc && <p className="loc-coords">Coordinates: {loc.latitude?.toFixed(6)}, {loc.longitude?.toFixed(6)}</p>}
                                    </div>
                                </div>
                                <button className="location-detect-btn" onClick={detectLocation} disabled={locationLoading}>
                                    {locationLoading
                                        ? <><Loader2 size={18} className="spin-anim" /> Detecting GPS location…</>
                                        : <><Navigation size={18} /> Auto-Detect My Location</>
                                    }
                                </button>
                                <p className="loc-hint">📡 This uses your device GPS to pinpoint your farm. Required for weather alerts and local crop recommendations.</p>
                            </div>

                            {/* Farm Details */}
                            <div className="settings-card" style={{ marginTop: 20 }}>
                                <h4 className="settings-card-title">Farm Information</h4>
                                <div className="settings-input-grid">
                                    <div className="settings-field">
                                        <label>Farm Name</label>
                                        <input type="text" value={farmForm.farm_name} onChange={e => setFarmForm(p => ({...p, farm_name: e.target.value}))} placeholder="e.g. Green Valley Farm" />
                                    </div>
                                    <div className="settings-field">
                                        <label>Farm Size (Acres)</label>
                                        <input type="number" value={farmForm.farm_size_acres} onChange={e => setFarmForm(p => ({...p, farm_size_acres: e.target.value}))} placeholder="e.g. 5.5" />
                                    </div>
                                </div>
                                <div className="settings-input-grid" style={{ marginTop: 15 }}>
                                    <div className="settings-field">
                                        <label>Soil Type</label>
                                        <select value={farmForm.soil_type} onChange={e => setFarmForm(p => ({...p, soil_type: e.target.value}))}>
                                            <option value="">Select soil type</option>
                                            {['Clay', 'Sandy', 'Loamy', 'Silt', 'Peaty', 'Chalky', 'Black Cotton'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="settings-field">
                                        <label>Irrigation Type</label>
                                        <select value={farmForm.irrigation_type} onChange={e => setFarmForm(p => ({...p, irrigation_type: e.target.value}))}>
                                            <option value="">Select irrigation</option>
                                            {['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Canal', 'Groundwater'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="settings-field">
                                        <label>Farming Practice</label>
                                        <select value={farmForm.farming_practices} onChange={e => setFarmForm(p => ({...p, farming_practices: e.target.value}))}>
                                            <option value="">Select practice</option>
                                            {['Organic', 'Conventional', 'Integrated', 'Permaculture', 'Biodynamic', 'Hydroponic'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="settings-field" style={{ marginTop: 15 }}>
                                    <label>Crop Types <span className="field-hint">(comma-separated)</span></label>
                                    <input type="text" value={farmForm.crop_types} onChange={e => setFarmForm(p => ({...p, crop_types: e.target.value}))} placeholder="e.g. Tomatoes, Rice, Wheat" />
                                </div>
                            </div>
                            <SaveBtn onClick={saveFarmChanges} label="Save Farm Details" />
                        </motion.div>
                    )}

                    {/* NOTIFICATIONS */}
                    {activeSection === 'notifications' && (
                        <motion.div key="notif" className="settings-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <SectionHeader title="Notification Settings" subtitle="Choose what alerts you receive and how" />
                            <div className="settings-card">
                                <div className="toggle-list">
                                    {[
                                        { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive real-time alerts directly on your device' },
                                        { key: 'mission_alerts', label: 'Mission Alerts', desc: 'Get notified the moment new missions become available for your farm' },
                                        { key: 'weather_alerts', label: 'Weather Alerts', desc: 'Real-time severe weather warnings based on your GPS location' },
                                        { key: 'ai_suggestions', label: 'AI Smart Tips', desc: 'Weekly personalised farming advice generated specifically for your crops' },
                                    ].map(item => (
                                        <div key={item.key} className="toggle-row">
                                            <div className="toggle-info">
                                                <strong>{item.label}</strong>
                                                <span>{item.desc}</span>
                                            </div>
                                            <Toggle value={notifSettings[item.key]} onChange={val => setNotifSettings(p => ({ ...p, [item.key]: val }))} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <SaveBtn onClick={saveNotifications} label="Save Notification Settings" />
                        </motion.div>
                    )}

                    {/* AI PREFERENCES */}
                    {activeSection === 'preferences' && (
                        <motion.div key="pref" className="settings-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <SectionHeader title="AI & App Experience" subtitle="Customise how the GOO AI Advisor works for your farm" />
                            <div className="settings-card">
                                <label className="settings-group-label">AI Advice Priority</label>
                                <div className="pill-selector-row">
                                    {['Water-Saving', 'Yield Improvement', 'Organic Standards', 'Pest Prevention'].map(p => (
                                        <button key={p} className={`pill-option ${aiPrefs.advice_priority === p ? 'active' : ''}`}
                                            onClick={() => setAiPrefs(prev => ({ ...prev, advice_priority: p }))}>
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <div className="settings-divider" style={{ margin: '20px 0' }} />

                                <div className="toggle-row">
                                    <div className="toggle-info">
                                        <strong>AI Smart-Suggestions</strong>
                                        <span>Allow AI to generate weekly personalised missions from your live farm data</span>
                                    </div>
                                    <Toggle value={aiPrefs.ai_smart_suggestions} onChange={val => setAiPrefs(p => ({ ...p, ai_smart_suggestions: val }))} />
                                </div>

                                <div className="settings-divider" style={{ margin: '20px 0' }} />

                                <div className="settings-field">
                                    <label>Display Language</label>
                                    <select value={aiPrefs.language} onChange={e => setAiPrefs(p => ({ ...p, language: e.target.value }))}>
                                        {['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Marathi'].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            <SaveBtn onClick={saveAIPrefs} label="Save AI Preferences" />
                            <div className="settings-info-note">
                                💡 Your AI advisor reads these preferences before every conversation, automatically personalising its advice to your goals.
                            </div>
                        </motion.div>
                    )}

                    {/* PRIVACY */}
                    {activeSection === 'privacy' && (
                        <motion.div key="privacy" className="settings-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <SectionHeader title="Privacy & Security" subtitle="Control your data visibility and account access" />
                            <div className="settings-card">
                                <div className="toggle-list">
                                    {[
                                        { label: 'Public Profile', desc: 'Allow others to see your farm ranking and achievements on the leaderboard' },
                                        { label: 'Activity Visibility', desc: 'Show completed missions on the community feed' },
                                        { label: 'Location Sharing', desc: 'Share your approximate region with the farming community' },
                                    ].map((item, i) => (
                                        <div key={i} className="toggle-row">
                                            <div className="toggle-info"><strong>{item.label}</strong><span>{item.desc}</span></div>
                                            <Toggle value={i === 0} onChange={() => {}} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="settings-divider" />
                            <SectionHeader title="Account Security" />
                            <div className="settings-card">
                                <button className="settings-action-row-btn">
                                    <Smartphone size={18} color="#2d5a27" />
                                    <div><strong>Manage Login Devices</strong><span>View and revoke active sessions</span></div>
                                    <ChevronRight size={16} color="#aaa" />
                                </button>
                                <button className="settings-action-row-btn danger">
                                    <Trash2 size={18} color="#e63946" />
                                    <div><strong>Delete Account</strong><span>Permanently remove your data from GOO</span></div>
                                    <ChevronRight size={16} color="#aaa" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* DATA */}
                    {activeSection === 'data' && (
                        <motion.div key="data" className="settings-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <SectionHeader title="Data & History" subtitle="Manage your personal farming records and permissions" />
                            <div className="settings-card">
                                <div className="data-storage-card">
                                    <HardDrive size={28} color="#2d5a27" />
                                    <div>
                                        <h4>Your Farming Data</h4>
                                        <p>All mission history, AI conversations, and farm records are stored securely in the GOO cloud.</p>
                                        <div className="storage-bar-bg"><div className="storage-bar-fill" style={{ width: '25%' }} /></div>
                                        <span className="storage-label">~25% of your data storage used</span>
                                    </div>
                                </div>
                            </div>
                            <div className="settings-card" style={{ marginTop: 16 }}>
                                <button className="settings-action-row-btn">
                                    <Download size={18} color="#2d5a27" />
                                    <div><strong>Download Farming Data</strong><span>Export all records in CSV format</span></div>
                                    <ChevronRight size={16} color="#aaa" />
                                </button>
                                <button className="settings-action-row-btn">
                                    <RefreshCw size={18} color="#2d5a27" />
                                    <div><strong>Sync Farm Data</strong><span>Force refresh data across all devices</span></div>
                                    <ChevronRight size={16} color="#aaa" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* SUPPORT */}
                    {activeSection === 'support' && (
                        <motion.div key="support" className="settings-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <SectionHeader title="Help & About" subtitle="Get support from our team or learn more about GOO" />
                            <div className="help-cards-grid">
                                <div className="help-card"><HelpCircle size={28} color="#2d5a27" /><h4>Visit Help Center</h4><p>FAQs, Tutorials, and Guides</p></div>
                                <div className="help-card"><Mail size={28} color="#3b82f6" /><h4>Contact Support</h4><p>Talk to our farming experts</p></div>
                            </div>
                            <div className="about-info-card">
                                {[
                                    ['App Version', 'v2.4.0 (Beta)'],
                                    ['Account ID', profile?.id?.substring(0, 16) + '…'],
                                    ['System Status', { node: <><span className="online-dot" /> Systems Optimal</> }],
                                    ['Member Since', new Date(profile?.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                                ].map(([label, val]) => (
                                    <div key={label} className="about-info-row">
                                        <span>{label}</span>
                                        <strong>{val?.node || val}</strong>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};

export default SettingsPage;
