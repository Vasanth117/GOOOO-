import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Lock, Bell, Globe, Bot, Shield, 
    Database, Gift, Users, LifeBuoy, Info, 
    Camera, MapPin, Sprout, Mail, Eye, 
    EyeOff, LogOut, ChevronRight, Save,
    Smartphone, Moon, Sun, Type, Trash2,
    Download, HelpCircle, HardDrive, Key
} from 'lucide-react';
import avatar from '../assets/images/9.jpg';

const SETTINGS_SECTIONS = [
    { id: 'account', label: 'Account & Farm', icon: User },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'AI & Experience', icon: Bot },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'support', label: 'Help & About', icon: LifeBuoy }
];

const SettingsPage = () => {
    const [activeSection, setActiveSection] = useState('account');
    const [darkMode, setDarkMode] = useState(false);

    return (
        <div className="settings-layout">
            
            {/* ── SETTINGS SIDEBAR ── */}
            <aside className="settings-nav">
                <div className="settings-header">
                    <h2>Settings</h2>
                    <p>Manage your ecosystem</p>
                </div>
                <div className="settings-nav-list">
                    {SETTINGS_SECTIONS.map(section => (
                        <button 
                            key={section.id} 
                            className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <section.icon size={20} />
                            <span>{section.label}</span>
                            {activeSection === section.id && <ChevronRight size={14} className="active-arrow" />}
                        </button>
                    ))}
                </div>
                <button className="btn-logout-settings">
                    <LogOut size={18} /> Logout Session
                </button>
            </aside>

            {/* ── SETTINGS CONTENT ── */}
            <main className="settings-content-area">
                <AnimatePresence mode="wait">
                    
                    {/* ACCOUNT & FARM SECTION */}
                    {activeSection === 'account' && (
                        <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="section-title-wrap">
                                <h3>Account & Farm Details</h3>
                                <p>Keep your details updated for accurate AI recommendations</p>
                            </div>

                            <div className="settings-group">
                                <div className="profile-pic-edit">
                                    <img src={avatar} alt="Profile" />
                                    <button className="btn-change-pic"><Camera size={14} /> Change</button>
                                </div>
                                <div className="input-grid">
                                    <div className="f-input">
                                        <label>Full Name</label>
                                        <input type="text" defaultValue="Ravi Kumar" />
                                    </div>
                                    <div className="f-input">
                                        <label>Email Address</label>
                                        <input type="email" defaultValue="ravi.kumar@farm.com" />
                                    </div>
                                </div>
                                <div className="f-input" style={{marginTop: 15}}>
                                    <label>Bio</label>
                                    <textarea defaultValue="Organic rice farmer with 5 years experience." />
                                </div>
                            </div>

                            <div className="section-divider" />

                            <div className="section-title-wrap">
                                <h4>Farm Passport</h4>
                            </div>
                            <div className="input-grid">
                                <div className="f-input"><label>Farm Size (Acres)</label><input type="text" defaultValue="4.5" /></div>
                                <div className="f-input"><label>Main Crop Type</label><input type="text" defaultValue="Paddy" /></div>
                                <div className="f-input"><label>Soil Category</label><input type="text" defaultValue="Black Cotton" /></div>
                                <div className="f-input"><label>Irrigation Type</label><input type="text" defaultValue="Drip Irrigation" /></div>
                            </div>
                            <button className="btn-save-settings"><Save size={16} /> Save Changes</button>
                        </motion.div>
                    )}

                    {/* PRIVACY SECTION */}
                    {activeSection === 'privacy' && (
                        <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="section-title-wrap">
                                <h3>Privacy & Security</h3>
                                <p>Control who sees your farming journey and secure your data</p>
                            </div>
                            
                            <div className="toggle-list">
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Public Profile</strong>
                                        <span>Allow anyone to see your farm ranking and stats</span>
                                    </div>
                                    <div className="switch active" />
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Activity Visibility</strong>
                                        <span>Show your completed tasks on the community feed</span>
                                    </div>
                                    <div className="switch" />
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Two-Factor Authentication</strong>
                                        <span>Add an extra layer of security to your account</span>
                                    </div>
                                    <button className="btn-link-settings">Setup Now</button>
                                </div>
                            </div>

                            <div className="section-divider" style={{margin: '30px 0'}} />
                            
                            <div className="section-title-wrap"><h4>Account Security</h4></div>
                            <button className="btn-outline-settings"><Lock size={16} /> Change Master Password</button>
                            <button className="btn-outline-settings" style={{marginTop: 10}}><Smartphone size={16} /> Manage Login Devices</button>
                        </motion.div>
                    )}

                    {/* AI & EXPERIENCE SECTION */}
                    {activeSection === 'preferences' && (
                        <motion.div key="pref" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="section-title-wrap">
                                <h3>AI & App Experience</h3>
                                <p>Customize how the AI Advisor helps your farm</p>
                            </div>

                            <div className="settings-group">
                                <label className="group-label">AI Advice Priority</label>
                                <div className="pill-selector">
                                    {['Water-Saving', 'Yield Improvement', 'Organic Standards', 'Pest Prevention'].map(p => (
                                        <button key={p} className={`pill-btn ${p === 'Water-Saving' ? 'active' : ''}`}>{p}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="toggle-item" style={{marginTop: 30}}>
                                <div className="toggle-info">
                                    <strong>AI Smart-Suggestions</strong>
                                    <span>Allow AI to auto-generate weekly missions for you</span>
                                </div>
                                <div className="switch active" />
                            </div>

                            <div className="section-divider" style={{margin: '30px 0'}} />

                            <div className="section-title-wrap"><h4>Interface Settings</h4></div>
                            <div className="input-grid">
                                <div className="f-input">
                                    <label>Display Language</label>
                                    <select><option>English</option><option>Telugu</option><option>Hindi</option></select>
                                </div>
                                <div className="f-input">
                                    <label>Font Scaling</label>
                                    <select><option>Standard</option><option>Large</option><option>Maximum</option></select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* DATA & STORAGE */}
                    {activeSection === 'data' && (
                        <motion.div key="data" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="section-title-wrap">
                                <h3>Data & History</h3>
                                <p>Manage your personal farming records and permissions</p>
                            </div>

                            <div className="data-card">
                                <div className="data-icon"><HardDrive size={24} /></div>
                                <div className="data-info">
                                    <h4>Storage Usage</h4>
                                    <p>Your uploaded proof photos are taking 142MB</p>
                                    <div className="storage-bar"><div className="storage-fill" style={{width: '30%'}} /></div>
                                </div>
                                <button className="btn-clear">Clear Cache</button>
                            </div>

                            <div className="action-list-settings">
                                <button className="settings-action-btn">
                                    <div className="act-icon"><Download size={18} /></div>
                                    <div className="act-text">
                                        <strong>Download Farming Data</strong>
                                        <span>Export all your records in CSV/PDF format</span>
                                    </div>
                                    <ChevronRight size={18} color="#aaa" />
                                </button>
                                <button className="settings-action-btn danger">
                                    <div className="act-icon"><Trash2 size={18} /></div>
                                    <div className="act-text">
                                        <strong>Clear Task History</strong>
                                        <span>This will reset your sustainability progress tracking</span>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* HELP & ABOUT */}
                    {activeSection === 'support' && (
                        <motion.div key="support" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="section-title-wrap">
                                <h3>Help & Support</h3>
                                <p>Get help from our team or learn more about GOO</p>
                            </div>

                            <div className="help-grid">
                                <div className="help-card">
                                    <HelpCircle size={24} color="#2d5a27" />
                                    <h4>Visit Help Center</h4>
                                    <p>FAQs, Tutorials, and Guides</p>
                                </div>
                                <div className="help-card">
                                    <Mail size={24} color="#3b82f6" />
                                    <h4>Contact Support</h4>
                                    <p>Talk to our human experts</p>
                                </div>
                            </div>

                            <div className="about-info-box">
                                <div className="info-row"><span>App Version</span><strong>v2.4.0 (Alpha)</strong></div>
                                <div className="info-row"><span>System Status</span><strong><span className="dot-online" /> Systems Optimal</strong></div>
                                <div className="info-row"><span>Legal</span><strong>Terms & Privacy Policy</strong></div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

        </div>
    );
};

export default SettingsPage;
