import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './CommunityPage.css';
import {
    Users, Search, Filter, MessageSquare, ThumbsUp, 
    Share2, Bookmark, Award, ShieldCheck, UserCheck,
    MapPin, Sprout, Target, ChevronRight, Plus, 
    CheckCircle2, Info, Globe, HelpCircle, GraduationCap,
    Send, UserPlus, Clock, Loader2, Image as ImageIcon,
    X, Heart, MoreHorizontal, TrendingUp, Droplets, Leaf,
    Flame, Zap, Star, Wind, Sun, Bug, Activity, Radio
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

const GROUPS = [
    { id: 1, name: 'Warangal Rice Union', members: '1.2k', type: 'Location', Icon: Sprout },
    { id: 2, name: 'Organic Pioneers', members: '850', type: 'Interest', Icon: Leaf },
    { id: 3, name: 'Vegetable Tech', members: '2.4k', type: 'Crop', Icon: Target },
    { id: 4, name: 'Eco-Water Saviors', members: '300', type: 'Impact', Icon: Droplets },
    { id: 5, name: 'Solar IoT Network', members: '1.5k', type: 'Tech', Icon: Sun },
    { id: 6, name: 'Pest Control Alliance', members: '4.1k', type: 'Interest', Icon: Bug },
    { id: 7, name: 'North India Wheat Group', members: '3.2k', type: 'Location', Icon: Wind },
    { id: 8, name: 'Drone Surveillance Crew', members: '950', type: 'Tech', Icon: Radio }
];

const CommunityPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Core States
    const [activeCategory, setActiveCategory] = useState('All');
    const [posts, setPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    // UI Interaction States
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [expandedComments, setExpandedComments] = useState({}); 
    const [postComments, setPostComments] = useState({}); 
    const [loadingComments, setLoadingComments] = useState({});
    
    // Posting States
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef(null);

    // Sidebar Data
    const [experts, setExperts] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [joinedGroupIds, setJoinedGroupIds] = useState([]);
    const [liveActivity, setLiveActivity] = useState([]);

    // ─── DATA LOADING ───
    const loadFeed = async () => {
        try {
            let postType = '';
            if (activeCategory === 'Organic Experts') postType = 'eco';
            else if (activeCategory !== 'All Discussion' && activeCategory !== 'All') postType = 'missions';

            const [feedData, expertData, verificationData, profileData] = await Promise.all([
                apiService.getFeed(1, postType),
                apiService.getLeaderboard('national').catch(() => ({ leaderboard: [] })),
                (user && user.role === 'grc') 
                    ? apiService.getPendingVerifications().catch(() => ({ verifications: [] }))
                    : Promise.resolve({ verifications: [] }),
                apiService.getProfile().catch(() => ({ preferences: {} }))
            ]);

            setPosts(feedData.posts || []);
            setExperts((expertData.leaderboard || []).slice(0, 5));
            setVerifications(verificationData.verifications || []);
            setJoinedGroupIds(profileData.preferences?.joined_groups || []);
        } catch (error) {
            console.error('Failed to load community data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ─── LIVE ACTIVITY SIMULATOR (Real-time feel) ───
    useEffect(() => {
        const activities = [
            "🌿 Vikram just shared a crop health update.",
            "⭐ Priya earned the 'Water Savior' badge.",
            "🛰️ Drone Scan completed in Warangal Sector.",
            "🚜 New discussion started in Wheat Group.",
            "🌱 Soil moisture levels verified for Sector 4.",
            "✨ Arjun reached level 45 Master Farmer!"
        ];
        
        const interval = setInterval(() => {
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            setLiveActivity(prev => [randomActivity, ...prev].slice(0, 4));
        }, 8000);
        
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadFeed();
        const interval = setInterval(loadFeed, 20000); // 20s for real-time sync
        return () => clearInterval(interval);
    }, [activeCategory]);

    // ─── HANDLERS ───
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !selectedFile) return;
        setIsPosting(true);
        try {
            const formData = new FormData();
            formData.append('content', newPostContent);
            if (selectedFile) formData.append('image', selectedFile);
            
            const response = await apiService.createPost(formData);
            
            // Optimistic UI update: Add the post locally to the top of the feed
            if (response && response.post) {
                setPosts(prev => [response.post, ...prev]);
            } else {
                loadFeed();
            }
            
            setNewPostContent('');
            setSelectedFile(null);
            setFilePreview(null);
        } catch (error) {
            alert('Error creating post. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleToggleLike = async (postId) => {
        setPosts(prev => prev.map(p => 
            p.id === postId 
                ? { 
                    ...p, 
                    is_liked_by_me: !p.is_liked_by_me, 
                    likes_count: p.is_liked_by_me ? p.likes_count - 1 : p.likes_count + 1 
                  }
                : p
        ));
        try {
            await apiService.toggleLike(postId);
        } catch (error) {
            loadFeed();
        }
    };

    const handleToggleFollow = async (authorId) => {
        setPosts(prev => prev.map(p => 
            p.author.id === authorId 
                ? { ...p, author: { ...p.author, is_followed_by_me: !p.author.is_followed_by_me } }
                : p
        ));
        try {
            await apiService.toggleFollow(authorId);
        } catch (error) {
            loadFeed();
        }
    };

    const toggleComments = async (postId) => {
        const isOpen = expandedComments[postId];
        setExpandedComments(prev => ({ ...prev, [postId]: !isOpen }));
        if (!isOpen && !postComments[postId]) {
            fetchComments(postId);
        }
    };

    const fetchComments = async (postId) => {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        try {
            const data = await apiService.getComments(postId);
            setPostComments(prev => ({ ...prev, [postId]: data.comments }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
    };

    const handleAddComment = async (postId, content) => {
        if (!content.trim()) return;
        try {
            const newComment = await apiService.addComment(postId, content);
            setPostComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment]
            }));
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
        } catch (err) {
            alert("Comment failed.");
        }
    };

    const handleToggleGroup = async (groupId) => {
        const isJoined = joinedGroupIds.includes(groupId);
        const newJoined = isJoined ? joinedGroupIds.filter(id => id !== groupId) : [...joinedGroupIds, groupId];
        setJoinedGroupIds(newJoined);
        try {
            await apiService.updatePreferences({ joined_groups: newJoined });
        } catch (error) {
            setJoinedGroupIds(joinedGroupIds); 
        }
    };

    const filteredPosts = posts.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="community-layout">
            
            {/* ── LEFT SIDEBAR ── */}
            <aside className="community-sidebar-left">
                <div className="sidebar-sticky-wrap">
                    <div className="sidebar-card">
                        <h3 className="sidebar-section-title"><Globe size={14} /> My Communities</h3>
                        <div className="group-list">
                            {GROUPS.map(group => {
                                const isJoined = joinedGroupIds.includes(group.id);
                                return (
                                    <motion.div key={group.id} className="group-mini-row" whileHover={{ x: 6 }}>
                                        <div className="group-icon-avatar">
                                            <group.Icon size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="group-info">
                                            <div className="group-name">{group.name}</div>
                                            <div className="group-meta">{group.members} active</div>
                                        </div>
                                        <button 
                                            className={`group-join-toggle ${isJoined ? 'joined' : ''}`}
                                            onClick={() => handleToggleGroup(group.id)}
                                        >
                                            {isJoined ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h3 className="sidebar-section-title"><Target size={14} /> Knowledge Hub</h3>
                        <div className="nav-vertical-list">
                            {['All Discussion', 'Organic Experts', 'Tech Tips', 'Market Trends'].map(cat => (
                                <button 
                                    key={cat} 
                                    className={`nav-v-btn ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── CENTER FEED ── */}
            <main className="community-feed-center">
                <header className="feed-header-glass">
                    <div className="search-bar-premium">
                        <Search size={18} color="var(--color-text-3)" />
                        <input 
                            type="text" 
                            placeholder="Search discussions, experts, or hashtags..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="header-actions-group">
                             <button className="filter-btn-glass"><Filter size={16} /></button>
                        </div>
                    </div>
                </header>

                <div className="post-creator-card">
                    <div className="creator-main">
                        {user?.profile_picture ? (
                            <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_picture}`} alt="me" className="creator-avatar" />
                        ) : (
                            <div className="creator-avatar avatar-luxe-init" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                                {user?.name?.[0] || 'U'}
                            </div>
                        )}
                        <div className="creator-input-wrap">
                            <textarea 
                                placeholder="What's growing on your farm today?"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    
                    <AnimatePresence>
                        {filePreview && (
                            <motion.div 
                                className="upload-preview-wrap"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <img src={filePreview} alt="preview" />
                                <button className="remove-file-btn" onClick={() => { setSelectedFile(null); setFilePreview(null); }}>
                                    <X size={16} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="creator-actions">
                        <div className="tool-pill-group">
                            <button className="tool-pill" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon size={18} />
                                <span>Media</span>
                            </button>
                            <button className="tool-pill"><Award size={18} color="#f97316" /> <span>Achievement</span></button>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
                        </div>
                        <button 
                            className="post-submit-btn-premium" 
                            disabled={isPosting || (!newPostContent.trim() && !selectedFile)}
                            onClick={handleCreatePost}
                        >
                            {isPosting ? <Loader2 size={18} className="spinner" /> : <><Send size={16} /> Post Discussion</>}
                        </button>
                    </div>
                </div>

                <div className="feed-stream">
                    {loading ? (
                        <div className="feed-skeleton-wrap">
                            <div className="skeleton-card" />
                            <div className="skeleton-card" />
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="empty-feed-state">
                            <Globe size={48} color="var(--color-border)" />
                            <h3>Community Feed is Empty</h3>
                            <p>No discussions found matching your current filters.</p>
                        </div>
                    ) : (
                        filteredPosts.map((post, idx) => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                idx={idx} 
                                user={user}
                                onLike={() => handleToggleLike(post.id)}
                                onFollow={() => handleToggleFollow(post.author.id)}
                                onNavigate={(path) => navigate(path)}
                                comments={postComments[post.id] || []}
                                isCommentsOpen={expandedComments[post.id]}
                                onToggleComments={() => toggleComments(post.id)}
                                isLoadingComments={loadingComments[post.id]}
                                onAddComment={(text) => handleAddComment(post.id, text)}
                            />
                        ))
                    )}
                </div>
            </main>

            {/* ── RIGHT SIDEBAR ── */}
            <aside className="community-sidebar-right">
                <div className="sidebar-sticky-wrap">
                    <motion.div className="grc-luxe-card" whileHover={{ scale: 1.02 }}>
                        <div className="grc-card-overlay" />
                        <div className="grc-content-relative">
                            <div className="grc-status-chip"><ShieldCheck size={14} /> Verified Circle</div>
                            <h3>Green Revolution Club</h3>
                            <p>Join the elite tier of farmers driving the global sustainability movement.</p>
                            <button className="grc-action-btn" onClick={() => setShowApplyModal(true)}>
                                Explore Membership <ChevronRight size={16} />
                            </button>
                        </div>
                    </motion.div>

                    <div className="sidebar-widget-premium">
                        <div className="widget-p-header">
                            <Activity size={18} className="icon-pulse" />
                            <span>Live Activity Feed</span>
                        </div>
                        <div className="widget-p-body">
                            <AnimatePresence mode='popLayout'>
                                {liveActivity.length === 0 ? (
                                    <div className="activity-placeholder">Monitoring live events...</div>
                                ) : (
                                    liveActivity.map((activity, i) => (
                                        <motion.div 
                                            key={activity} 
                                            className="activity-row"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            layout
                                        >
                                            <div className="activity-dot" />
                                            <span>{activity}</span>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="sidebar-widget-premium">
                        <div className="widget-p-header">
                            <Award size={18} color="var(--color-gold)" />
                            <span>Top Contributors</span>
                        </div>
                        <div className="widget-p-body">
                            {experts.length === 0 ? (
                                [1,2,3].map(i => <div key={i} className="skeleton-row" />)
                            ) : (
                                experts.map((exp, i) => (
                                    <div key={i} className="expert-row-p" onClick={() => navigate(`/profile/${exp.id}`)}>
                                        <div className="rank-badge">{i+1}</div>
                                        <div className="expert-p-info">
                                            <div className="exp-name">{exp.name}</div>
                                            <div className="exp-stats">{exp.tier} • {exp.score} XP</div>
                                        </div>
                                        <TrendingUp size={14} className="trend-up" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Application Modal */}
            <AnimatePresence>
                {showApplyModal && (
                    <div className="modal-backdrop" onClick={() => setShowApplyModal(false)}>
                        <motion.div 
                            className="grc-modal-p"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-p-header">
                                <div className="modal-p-icon"><ShieldCheck size={40} /></div>
                                <h2>Apply for GRC Access</h2>
                                <p>Unlock exclusive rewards and peer-verification power.</p>
                            </div>
                            <div className="modal-p-body">
                                <div className="req-grid-p">
                                    <div className="req-box-p"><CheckCircle2 size={16} /> Score &gt; 90</div>
                                    <div className="req-box-p"><CheckCircle2 size={16} /> 10+ Missions</div>
                                    <div className="req-box-p"><CheckCircle2 size={16} /> Active Weekly</div>
                                </div>
                                <div className="input-field-p">
                                    <label>Briefly state your commitment</label>
                                    <textarea placeholder="Tell us how you'll help the community..." />
                                </div>
                            </div>
                            <div className="modal-p-footer">
                                <button className="btn-p-ghost" onClick={() => setShowApplyModal(false)}>Cancel</button>
                                <button className="btn-p-solid" onClick={() => { setHasApplied(true); setShowApplyModal(false); }}>Submit Application</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

const PostCard = ({ post, idx, user, onLike, onFollow, onNavigate, comments, isCommentsOpen, onToggleComments, isLoadingComments, onAddComment }) => {
    const [commentText, setCommentText] = useState('');

    return (
        <motion.div 
            className="post-card-luxe"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
        >
            <div className="post-header-luxe">
                <div className="author-luxe" onClick={() => onNavigate(`/profile/${post.author.id}`)}>
                    <div className="avatar-luxe-wrap">
                        {post.author.profile_picture ? (
                            <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${post.author.profile_picture}`} alt="avatar" />
                        ) : (
                            <div className="avatar-luxe-init">{post.author.name[0]}</div>
                        )}
                        {post.author.is_grc_member && <div className="grc-badge-mini"><ShieldCheck size={10} /></div>}
                    </div>
                    <div className="author-luxe-info">
                        <div className="name-row">
                            <span className="author-name-p">{post.author.name}</span>
                            <span className={`tag-tier-p ${post.author.score_tier?.toLowerCase() || 'beginner'}`}>
                                {post.author.score_tier || 'Beginner'}
                            </span>
                        </div>
                        <div className="meta-row-p">
                            <Clock size={12} />
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="separator">•</span>
                            <Globe size={12} />
                            <span>Public</span>
                        </div>
                    </div>
                </div>
                {post.author.id !== user?.id && (
                    <button 
                        className={`btn-follow-p ${post.author.is_followed_by_me ? 'following' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onFollow(); }}
                    >
                        {post.author.is_followed_by_me ? 'Following' : <><UserPlus size={14} /> Follow</>}
                    </button>
                )}
            </div>

            <div className="post-body-luxe">
                <p className="content-text-p">{post.content}</p>
                {post.image_url && (
                    <div className="media-container-p">
                        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${post.image_url}`} alt="post" />
                    </div>
                )}
                <div className="impact-footer-p">
                    <div className="impact-bubble water"><Droplets size={14} /> {post.impact?.water || '120L Saved'}</div>
                    <div className="impact-bubble eco"><Leaf size={14} /> {post.impact?.chemical || 'Organic'}</div>
                    <div className="impact-bubble info"><Sprout size={14} /> {post.impact?.method || 'Traditional'}</div>
                </div>
            </div>

            <div className="post-actions-luxe">
                <div className="action-group-p">
                    <button className={`btn-action-p ${post.is_liked_by_me ? 'active' : ''}`} onClick={onLike}>
                        <Heart size={20} fill={post.is_liked_by_me ? "var(--color-danger)" : "none"} />
                        <span>{post.likes_count}</span>
                    </button>
                    <button className="btn-action-p" onClick={onToggleComments}>
                        <MessageSquare size={20} />
                        <span>{post.comments_count}</span>
                    </button>
                    <button className="btn-action-p"><Share2 size={20} /></button>
                </div>
                <button className="btn-action-p"><Bookmark size={20} /></button>
            </div>

            <AnimatePresence>
                {isCommentsOpen && (
                    <motion.div 
                        className="comments-section-p"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <div className="comments-scroll-p">
                            {isLoadingComments ? (
                                <div className="loader-center"><Loader2 size={24} className="spinner" /></div>
                            ) : comments.length === 0 ? (
                                <div className="no-comments-p">Start a conversation on this post...</div>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="comment-bubble-row">
                                        <div className="c-avatar-p">{c.author.name[0]}</div>
                                        <div className="c-content-p">
                                            <div className="c-user-p">{c.author.name}</div>
                                            <div className="c-text-p">{c.content}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="comment-input-box-p">
                            <input 
                                type="text" 
                                placeholder="Write a comment..." 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        onAddComment(commentText);
                                        setCommentText('');
                                    }
                                }}
                            />
                            <button className="btn-send-p" onClick={() => { onAddComment(commentText); setCommentText(''); }}>
                                <Send size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CommunityPage;
