import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, MessageSquare, ThumbsUp, 
    Share2, Bookmark, Award, ShieldCheck, UserCheck,
    MapPin, Sprout, Target, ChevronRight, Plus, 
    CheckCircle2, Info, Globe, HelpCircle, GraduationCap,
    Send, UserPlus, Clock
} from 'lucide-react';
import avatar2 from '../assets/images/2.jpg';
import avatar3 from '../assets/images/3.jpg';
import avatar4 from '../assets/images/4.jpg';
import img1 from '../assets/images/1.jpg';

const GROUPS = [
    { id: 1, name: 'Warangal Rice Union', members: '1.2k', type: 'Location', joined: true },
    { id: 2, name: 'Organic Pioneers', members: '850', type: 'Interest', joined: false },
    { id: 3, name: 'Vegetable Tech', members: '2.4k', type: 'Crop', joined: true },
    { id: 4, name: 'Eco-Water Saviors', members: '300', type: 'Impact', joined: false }
];

const DISCUSSIONS = [
    {
        id: 1, author: 'Suresh Raina', avatar: avatar2, time: '2h ago',
        category: 'Pest Control', title: 'Natural ways to stop Brown Plant Hopper?',
        content: 'I noticed some yellowing in my paddy field. I want to avoid chemicals this season. Any proven organic decoctions?',
        upvotes: 45, comments: 12, tags: ['Paddy', 'Organic']
    },
    {
        id: 2, author: 'Dr. Anjali Singh', avatar: avatar3, time: '5h ago', role: 'Expert',
        category: 'Soil Health', title: 'Top 3 Green Manures for Southern Soil',
        content: 'Dhaincha and Sunnhemp are performing excellently this season. Here is a step-by-step guide on incorporating them...',
        upvotes: 120, comments: 34, tags: ['Expert Advice', 'Soil']
    }
];

const CommunityPage = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    return (
        <div className="community-layout">
            
            {/* ── LEFT: DISCOVERY & GROUPS ── */}
            <aside className="community-sidebar-left">
                <div style={{ marginBottom: 25 }}>
                    <h3 className="sidebar-section-title">Communities</h3>
                    <div className="group-list">
                        {GROUPS.map(group => (
                            <motion.div key={group.id} className="group-mini-card" whileHover={{ x: 5 }}>
                                <div className="group-icon-box">
                                    {group.type === 'Location' ? <MapPin size={16} /> : <Sprout size={16} />}
                                </div>
                                <div className="group-info">
                                    <div className="group-name">{group.name}</div>
                                    <div className="group-meta">{group.members} members</div>
                                </div>
                                {group.joined ? <CheckCircle2 size={16} color="#2d5a27" /> : <Plus size={16} color="#aaa" />}
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="sidebar-section-title">Knowledge Forum</h3>
                    <div className="forum-categories">
                        {['All', 'Crop Based', 'Organic Farming', 'Water Mgmt', 'Pest Control'].map(cat => (
                            <button 
                                key={cat} 
                                className={`forum-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ── CENTER: DISCUSSION FEED ── */}
            <main className="community-feed-center">
                <header className="community-header">
                    <div className="search-pill-box">
                        <Search size={18} color="#888" />
                        <input type="text" placeholder="Search topics, questions, or peer farmers..." />
                        <Filter size={18} color="#888" />
                    </div>
                </header>

                <div className="create-discuss-box">
                    <img src={avatar4} alt="me" className="mini-avatar" />
                    <button className="fake-input-btn">Ask the community a question...</button>
                </div>

                <div className="discuss-list">
                    {DISCUSSIONS.map((disc, i) => (
                        <motion.div 
                            key={disc.id} className="discuss-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="discuss-top">
                                <img src={disc.avatar} alt="author" className="mini-avatar" />
                                <div>
                                    <div className="discuss-author">
                                        {disc.author} {disc.role && <span className="expert-badge"><GraduationCap size={10} /> Expert</span>}
                                    </div>
                                    <div className="discuss-meta">{disc.category} • {disc.time}</div>
                                </div>
                            </div>
                            <h3 className="discuss-title">{disc.title}</h3>
                            <p className="discuss-content">{disc.content}</p>
                            <div className="discuss-tags">
                                {disc.tags.map(tag => <span key={tag} className="d-tag">#{tag}</span>)}
                            </div>
                            <div className="discuss-actions">
                                <button className="d-action"><ThumbsUp size={16} /> <span>{disc.upvotes}</span></button>
                                <button className="d-action"><MessageSquare size={16} /> <span>{disc.comments}</span></button>
                                <button className="d-action"><Share2 size={16} /></button>
                                <button className="d-action" style={{marginLeft: 'auto'}}><Bookmark size={16} /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* ── RIGHT: CLUBS & VERIFICATION ── */}
            <aside className="community-sidebar-right">
                
                {/* Green Revolution Club - Premium Card */}
                <motion.div className="green-club-card" whileHover={{ y: -5 }}>
                    <div className="club-glow" />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="club-header">
                            <ShieldCheck size={24} color="#d4af37" />
                            <span>Green Revolution Club</span>
                        </div>
                        <p className="club-desc">The elite circle of verified eco-pioneers. Help verify nearby farms and lead the movement.</p>
                        {!hasApplied ? (
                            <button className="btn-join-club" onClick={() => setShowApplyModal(true)}>
                                Apply for Membership <ChevronRight size={14} />
                            </button>
                        ) : (
                            <div className="application-pending">
                                <Clock size={14} /> Application Under Review
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Peer Verification Queue */}
                <div className="verification-widget">
                    <div className="widget-title-row">
                        <UserCheck size={18} color="#2d5a27" />
                        <span>Peer Verification (3)</span>
                    </div>
                    {[
                        { name: 'Arjun P.', task: 'Used Bio-Pesticide', dist: '0.8 km' },
                        { name: 'Megha R.', task: 'Compost Pit Setup', dist: '1.2 km' }
                    ].map((item, i) => (
                        <div key={i} className="verify-item">
                            <div className="verify-user-info">
                                <div className="v-name">{item.name}</div>
                                <div className="v-task">{item.task}</div>
                            </div>
                            <div className="v-dist">{item.dist}</div>
                            <button className="v-check-btn"><ChevronRight size={14} /></button>
                        </div>
                    ))}
                    <button className="view-all-btn">View All Queue</button>
                </div>

                {/* Expert Recommendations */}
                <div className="expert-widget">
                    <div className="widget-title-row">
                        <Award size={18} color="#2d5a27" />
                        <span>Top Contributors</span>
                    </div>
                    {[
                        { name: 'Dr. Anjali Singh', xp: '15k XP', role: 'Agronomist' },
                        { name: 'Vikram Mehta', xp: '12k XP', role: 'Organic Master' }
                    ].map((exp, i) => (
                        <div key={i} className="expert-list-item">
                            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{exp.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#888' }}>{exp.role} • {exp.xp}</div>
                        </div>
                    ))}
                </div>

            </aside>

            {/* ── APPLICATION MODAL ── */}
            <AnimatePresence>
                {showApplyModal && (
                    <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
                        <motion.div 
                            className="apply-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <ShieldCheck size={32} color="#d4af37" />
                                <h3>Apply for Green Revolution Club</h3>
                            </div>
                            <div className="modal-body">
                                <p>Membership requires an active commitment to verify nearby farmers weekly and maintain a sustainability score &gt; 90.</p>
                                <div className="form-group-luxe">
                                    <label>Why do you want to join the core movement?</label>
                                    <textarea className="modal-textarea" placeholder="e.g. I want to help my local village transition to organic farming..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-m-cancel" onClick={() => setShowApplyModal(false)}>Cancel</button>
                                <button className="btn-m-submit" onClick={() => { setHasApplied(true); setShowApplyModal(false); }}>Submit Application</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default CommunityPage;
