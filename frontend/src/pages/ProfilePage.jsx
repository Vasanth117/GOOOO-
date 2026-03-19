import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, MapPin, Calendar, Award, Droplets, 
    Leaf, Zap, Star, Settings, Edit3, Share2, 
    CheckCircle2, TrendingUp, Trophy, Globe,
    ChevronRight, Info, ShieldCheck, Mail, Phone,
    Grid, History, PieChart, MessageSquare, Flame,
    ArrowUpRight, ArrowDownRight, Bot, Image as ImageIcon,
    Sprout, Waves, Beaker, Clock, AlertCircle
} from 'lucide-react';
import avatar from '../assets/images/9.jpg';
import cover from '../assets/images/1.jpg';
import img1 from '../assets/images/1.jpg';
import img2 from '../assets/images/2.jpg';
import img3 from '../assets/images/3.jpg';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('Overview');

    const [farmer] = useState({
        name: 'Ravi Kumar',
        username: '@ravifarms_99',
        role: 'Diamond Eco-Warrior',
        location: { village: 'Warangal', district: 'Hanamkonda', state: 'Telangana' },
        joined: 'March 2025',
        bio: 'Organic rice farmer | 5 years experience 🌱 | Committed to a chemical-free future.',
        farm: { size: '4.5 Acres', soil: 'Black Cotton', crops: 'Paddy, Chili, Cotton', irrigation: 'Drip & Bore' },
        stats: { posts: 24, followers: 850, following: 120, tasksCompleted: 142, rank: '#12 District' },
        sustainability: { score: 92, status: 'Advanced', trend: '+4% this month' },
        streaks: { current: 15, longest: 42 }
    });

    const IMPACT = [
        { label: 'Water Saved', val: '12,400 L', icon: Droplets, color: '#3b82f6' },
        { label: 'Chemicals Avoided', val: '85 kg', icon: Leaf, color: '#768953' },
        { label: 'Soil Health', val: '+22%', icon: Sprout, color: '#2d5a27' }
    ];

    const TABS = ['Overview', 'Activity', 'Achievements', 'Analytics'];

    return (
        <div className="profile-page-wrapper">
            
            {/* ── IDENTITY HEADER (MASTER) ── */}
            <div className="profile-header-premium">
                <div className="p-hero" style={{ backgroundImage: `url(${cover})` }}>
                    <div className="p-hero-overlay" />
                    <div className="p-header-top-actions">
                        <button className="h-action-btn"><Share2 size={18} /></button>
                        <button className="h-action-btn"><Settings size={18} /></button>
                    </div>
                </div>

                <div className="p-identity-card">
                    <div className="p-avatar-section">
                        <div className="p-avatar-container">
                            <img src={avatar} alt="Ravi" className="p-avatar-img" />
                            <div className="p-rank-float"><Trophy size={16} /></div>
                        </div>
                        <div className="p-main-info">
                            <div className="p-name-row">
                                <h1>{farmer.name} <ShieldCheck size={20} color="#2d5a27" /></h1>
                                <span className="p-role-tag">{farmer.role}</span>
                            </div>
                            <div className="p-username-row">
                                <span className="u-name">{farmer.username}</span>
                                <span className="u-sep">•</span>
                                <span className="u-loc"><MapPin size={14} /> {farmer.location.village}, {farmer.location.state}</span>
                            </div>
                            <p className="p-bio">{farmer.bio}</p>
                        </div>
                        <div className="p-action-btns">
                            <button className="btn-edit-p"><Edit3 size={16} /> Edit Profile</button>
                            <button className="btn-msg-p"><MessageSquare size={16} /></button>
                        </div>
                    </div>

                    <div className="p-stats-bar">
                        <div className="stat-p"><strong>{farmer.stats.posts}</strong><span>Posts</span></div>
                        <div className="stat-p"><strong>{farmer.stats.followers}</strong><span>Followers</span></div>
                        <div className="stat-p"><strong>{farmer.stats.following}</strong><span>Following</span></div>
                        <div className="stat-p"><strong>{farmer.stats.tasksCompleted}</strong><span>Tasks</span></div>
                        <div className="stat-p"><strong>{farmer.stats.rank}</strong><span>Rank</span></div>
                    </div>
                </div>
            </div>

            {/* ── TAB NAVIGATION ── */}
            <div className="p-tab-nav">
                {TABS.map(tab => (
                    <button 
                        key={tab} 
                        className={`p-tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                        {activeTab === tab && <motion.div className="tab-underline" layoutId="pTab" />}
                    </button>
                ))}
            </div>

            {/* ── MASTER CONTENT AREA ── */}
            <div className="p-tab-content">
                <AnimatePresence mode="wait">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'Overview' && (
                        <motion.div className="overview-tab-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            
                            {/* Left: Performance & Impact */}
                            <div className="ov-left">
                                <div className="p-card sustainability-card">
                                    <div className="card-header">
                                        <div className="title-wrap">
                                            <Leaf size={18} color="#2d5a27" />
                                            <h3>Sustainability Score</h3>
                                        </div>
                                        <div className="score-trend up"><ArrowUpRight size={14} /> {farmer.sustainability.trend}</div>
                                    </div>
                                    <div className="score-display">
                                        <div className="score-num">{farmer.sustainability.score}</div>
                                        <div className="score-level">{farmer.sustainability.status} Level</div>
                                    </div>
                                    <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: '92%' }} /></div>
                                </div>

                                <div className="p-impact-row">
                                    {IMPACT.map(item => (
                                        <div key={item.label} className="p-impact-card">
                                            <item.icon size={20} color={item.color} />
                                            <div className="im-val">{item.val}</div>
                                            <div className="im-label">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-card ai-insights">
                                    <div className="card-header">
                                        <div className="title-wrap"><Bot size={18} color="#768953" /> <h3>AI Personal Advice</h3></div>
                                    </div>
                                    <div className="ai-advice-list">
                                        <div className="ai-advice-item">
                                            <CheckCircle2 size={14} color="#2d5a27" />
                                            <p>Switch to organic urea for next paddy cycle to increase score to 95.</p>
                                        </div>
                                        <div className="ai-advice-item">
                                            <CheckCircle2 size={14} color="#2d5a27" />
                                            <p>Your water saving is 12% higher than village average. Great work!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Farm Details & Streaks */}
                            <div className="ov-right">
                                <div className="p-card farm-details-card">
                                    <h3 className="widget-title">Farm Passport</h3>
                                    <div className="farm-info-grid">
                                        <div className="fi-item"><span>Size</span><strong>{farmer.farm.size}</strong></div>
                                        <div className="fi-item"><span>Soil</span><strong>{farmer.farm.soil}</strong></div>
                                        <div className="fi-item"><span>Irrigation</span><strong>{farmer.farm.irrigation}</strong></div>
                                        <div className="fi-item"><span>Crops</span><strong>{farmer.farm.crops}</strong></div>
                                    </div>
                                </div>

                                <div className="p-card streak-card">
                                    <div className="streak-header">
                                        <Flame size={24} color="#e63946" />
                                        <div className="streak-nums">
                                            <div className="s-num">{farmer.streaks.current} Days</div>
                                            <div className="s-label">Active Eco-Streak</div>
                                        </div>
                                    </div>
                                    <div className="longest-streak">🔥 Longest: {farmer.streaks.longest} days</div>
                                </div>
                                
                                <div className="p-card green-club-status">
                                    <ShieldCheck size={32} color="#d4af37" />
                                    <h3>Green Revolution Club</h3>
                                    <p>Official Member Since Apr 2025</p>
                                    <div className="verified-badge-mini">Verified Validator</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ACTIVITY TAB (PHOTO GRID) */}
                    {activeTab === 'Activity' && (
                        <motion.div className="activity-tab-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="activity-grid">
                                {[img1, img2, img3, img1, img2, img3].map((img, i) => (
                                    <div key={i} className="activity-grid-item">
                                        <img src={img} alt="post" />
                                        <div className="grid-overlay">
                                            <span><Star size={14} /> 45</span>
                                            <span><MessageSquare size={14} /> 12</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ACHIEVEMENTS TAB */}
                    {activeTab === 'Achievements' && (
                        <motion.div className="achievements-tab-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="badge-gallery-full">
                                {[
                                    { name: 'Water Saver', color: '#3b82f6', icon: Droplets, unlock: 'Unlocked' },
                                    { name: 'Soil Master', color: '#768953', icon: Leaf, unlock: 'Unlocked' },
                                    { name: 'Climate Champion', color: '#d4af37', icon: Globe, unlock: 'Locked (Rank 10)' },
                                    { name: 'Bio Genius', color: '#2d5a27', icon: Beaker, unlock: 'Unlocked' }
                                ].map((badge, i) => (
                                    <div key={i} className={`p-badge-card ${badge.unlock.includes('Locked') ? 'locked' : ''}`}>
                                        <div className="b-circle" style={{ borderColor: badge.color }}>
                                            <badge.icon size={28} color={badge.color} />
                                        </div>
                                        <div className="b-name">{badge.name}</div>
                                        <div className="b-status">{badge.unlock}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ANALYTICS / TASKS TAB */}
                    {activeTab === 'Analytics' && (
                        <motion.div className="analytics-tab-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="task-history-list">
                                <h3 className="section-title">Task behavior (Monthly)</h3>
                                {[
                                    { t: 'Used organic compost', d: '24 Oct', s: 'Completed', p: '+20' },
                                    { t: 'Rainwater harvesting check', d: '22 Oct', s: 'Completed', p: '+15' },
                                    { t: 'Manual pest removal', d: '18 Oct', s: 'Missed', p: '-10' }
                                ].map((task, i) => (
                                    <div key={i} className={`task-h-item ${task.s.toLowerCase()}`}>
                                        <div className="th-icon">
                                            {task.s === 'Completed' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                        </div>
                                        <div className="th-info">
                                            <div className="th-name">{task.t}</div>
                                            <div className="th-date">{task.d}</div>
                                        </div>
                                        <div className="th-pts">{task.p}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

        </div>
    );
};

export default ProfilePage;
