import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, MessageSquare, Share2, Bookmark, MoreHorizontal,
    TrendingUp, Droplets, Leaf, TreePine, Zap, Trophy, Wind,
    CheckCircle, Plus, Award
} from 'lucide-react';
import img1 from '../assets/images/1.jpg';
import img2 from '../assets/images/2.jpg';
import img3 from '../assets/images/3.jpg';
import img4 from '../assets/images/4.jpg';
import img5 from '../assets/images/5.jpg';
import img6 from '../assets/images/6.jpg';
import img7 from '../assets/images/7.jpg';
import img8 from '../assets/images/8.jpg';
import img9 from '../assets/images/9.jpg';

const FEED_POSTS = [
    {
        id: 1, farmer: 'Ravi Kumar', location: 'Warangal, Telangana', farm: 'Green Valley Farm',
        avatar: img4, image: img1, tag: 'Daily Task Completed', tagColor: '#2d5a27',
        caption: 'Applied neem-oil spray across my paddy field today instead of chemical pesticides. Zero chemicals, healthy crop! 🌾',
        impact: { water: '200L saved', chemical: '0g chemical used', method: 'Organic Pest Control' },
        likes: 142, comments: 38, saved: false, liked: false, time: '2 hours ago',
    },
    {
        id: 2, farmer: 'Priya Sharma', location: 'Nashik, Maharashtra', farm: 'Sunrise Orchards',
        avatar: img5, image: img2, tag: 'Eco Farming Activity', tagColor: '#768953',
        caption: 'Completed my drip irrigation setup on 2 acres of grapes. 60% water reduction compared to flood irrigation. 💧',
        impact: { water: '1,200L saved', chemical: 'No excess runoff', method: 'Drip Irrigation' },
        likes: 87, comments: 21, saved: true, liked: true, time: '4 hours ago',
    },
    {
        id: 3, farmer: 'Amit Patel', location: 'Anand, Gujarat', farm: 'Patel Organic Co.',
        avatar: img6, image: img3, tag: 'Community Challenge', tagColor: '#d4af37',
        caption: 'Participating in the #PollinatorCorridor challenge! Planted 40 native flowering plants along the border of my field. 🐝',
        impact: { water: 'N/A', chemical: '0g pesticide near borders', method: 'Bio-Diversity Planting' },
        likes: 204, comments: 62, saved: false, liked: false, time: '6 hours ago',
    },
    {
        id: 4, farmer: 'Lakshmi Devi', location: 'Kurnool, Andhra Pradesh', farm: 'Devi Agro Farm',
        avatar: img7, image: img4, tag: 'Crop Growth Progress', tagColor: '#4c7c42',
        caption: 'Week 6 update on my turmeric crop! Using GOO AI-recommended soil nutrients, the root development is visibly stronger! 🌿',
        impact: { water: '15% less water used', chemical: 'Reduced by 30%', method: 'AI Soil Analytics' },
        likes: 316, comments: 74, saved: true, liked: true, time: '1 day ago',
    },
    {
        id: 5, farmer: 'Suresh Yadav', location: 'Jaipur, Rajasthan', farm: 'Desert Bloom',
        avatar: img8, image: img5, tag: 'Eco Farming Activity', tagColor: '#768953',
        caption: 'Set up a rainwater harvesting pit on my farm today. In a water-scarce region like Rajasthan, every drop matters. 🌧️',
        impact: { water: 'Stores up to 5,000L', chemical: 'No chemical involvement', method: 'Rainwater Harvesting' },
        likes: 189, comments: 45, saved: false, liked: false, time: '1 day ago',
    },
];

const PostCard = ({ post }) => {
    const [liked, setLiked] = useState(post.liked);
    const [likes, setLikes] = useState(post.likes);
    const [saved, setSaved] = useState(post.saved);
    const [showComments, setShowComments] = useState(false);

    return (
        <motion.div className="feed-card"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <div className="feed-card-header">
                <img src={post.avatar} alt={post.farmer} className="feed-avatar" />
                <div className="feed-farmer-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#1a1c19', fontSize: '1rem' }}>{post.farmer}</strong>
                        <CheckCircle size={14} color="#2d5a27" />
                    </div>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>📍 {post.location} · {post.farm}</span>
                    <span style={{ color: '#aaa', fontSize: '0.75rem' }}>{post.time}</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <motion.span className="post-tag"
                        style={{ background: post.tagColor + '20', color: post.tagColor, borderColor: post.tagColor + '40' }}
                        whileHover={{ scale: 1.05 }}>{post.tag}</motion.span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>
            <p className="feed-caption">{post.caption}</p>
            <div className="feed-img-wrapper">
                <motion.img src={post.image} alt="post" className="feed-img"
                    whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} />
            </div>
            <div className="eco-impact-bar">
                <div className="eco-chip"><Droplets size={13} /> {post.impact.water}</div>
                <div className="eco-chip"><Leaf size={13} /> {post.impact.chemical}</div>
                <div className="eco-chip"><TreePine size={13} /> {post.impact.method}</div>
            </div>
            <div className="feed-actions">
                <motion.button className={`feed-action-btn ${liked ? 'liked' : ''}`}
                    onClick={() => { setLiked(!liked); setLikes(liked ? likes - 1 : likes + 1); }}
                    whileTap={{ scale: 0.85 }}>
                    <Heart size={18} fill={liked ? '#e63946' : 'none'} color={liked ? '#e63946' : '#555'} />
                    <span style={{ color: liked ? '#e63946' : '#555' }}>{likes}</span>
                </motion.button>
                <motion.button className="feed-action-btn" whileTap={{ scale: 0.85 }}
                    onClick={() => setShowComments(!showComments)}>
                    <MessageSquare size={18} /><span>{post.comments}</span>
                </motion.button>
                <motion.button className="feed-action-btn" whileTap={{ scale: 0.85 }}>
                    <Share2 size={18} /><span>Share</span>
                </motion.button>
                <motion.button className={`feed-action-btn ${saved ? 'saved' : ''}`}
                    onClick={() => setSaved(!saved)} whileTap={{ scale: 0.85 }} style={{ marginLeft: 'auto' }}>
                    <Bookmark size={18} fill={saved ? '#2d5a27' : 'none'} color={saved ? '#2d5a27' : '#555'} />
                </motion.button>
            </div>
            <AnimatePresence>
                {showComments && (
                    <motion.div className="comment-box"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <input type="text" placeholder="Share your insights or advice..." className="comment-input" />
                        <button className="comment-submit">Post</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const Dashboard = () => (
    <div className="feed-layout">
        <div className="feed-column">
            <motion.div className="create-post-bar" whileHover={{ boxShadow: '0 8px 30px rgba(45,90,39,0.12)' }}>
                <img src={img9} alt="me" className="feed-avatar" />
                <button className="create-post-input">Share your farming activity today...</button>
                <motion.button className="create-post-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Plus size={16} /> Post
                </motion.button>
            </motion.div>
            <div className="feed-filter-row">
                {['All Posts', 'Missions', 'Eco Activities', 'Challenges', 'Progress'].map((f, i) => (
                    <motion.button key={f} className={`feed-filter-chip ${i === 0 ? 'active' : ''}`}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{f}</motion.button>
                ))}
            </div>
            {FEED_POSTS.map(post => <PostCard key={post.id} post={post} />)}
        </div>

        <aside className="feed-right-panel">
            {/* User Stats */}
            <motion.div className="widget-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <img src={img9} alt="me" style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover' }} />
                    <div>
                        <div style={{ fontWeight: 700, color: '#1a1c19' }}>Ravi Kumar</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Warangal, Telangana</div>
                        <div style={{ fontSize: '0.75rem', color: '#2d5a27', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Award size={12} /> GOO Eco-Warrior
                        </div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                        { label: 'Missions',   val: '42',    icon: Leaf,   color: '#2d5a27' },
                        { label: 'Eco Points', val: '3,210', icon: Zap,    color: '#d4af37' },
                        { label: 'CO₂ Saved',  val: '1.4T',  icon: Wind,   color: '#4c7c42' },
                        { label: 'Rank',       val: '#18',   icon: Trophy, color: '#768953' },
                    ].map(s => (
                        <div key={s.label} style={{ background: s.color + '12', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                            <s.icon size={18} color={s.color} style={{ marginBottom: '6px' }} />
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </motion.div>
            <motion.div className="widget-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <div className="widget-title"><TrendingUp size={16} /> Trending Missions</div>
                {[
                    { name: '#PollinatorCorridor', posts: '1.2K', color: '#d4af37' },
                    { name: '#DripRevolution',     posts: '890',  color: '#2d5a27' },
                    { name: '#SoilFirstChallenge', posts: '675',  color: '#768953' },
                    { name: '#ZeroChemical2026',   posts: '421',  color: '#4c7c42' },
                ].map(t => (
                    <div key={t.name} className="trend-item">
                        <div style={{ fontWeight: 700, color: t.color, fontSize: '0.85rem' }}>{t.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{t.posts} posts</div>
                    </div>
                ))}
            </motion.div>
            <motion.div className="widget-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <div className="widget-title"><Trophy size={16} /> Top Eco Farmers</div>
                {[
                    { name: 'Lakshmi Devi', pts: '5,820', avatar: img7 },
                    { name: 'Suresh Yadav', pts: '4,510', avatar: img8 },
                    { name: 'Priya Sharma', pts: '4,210', avatar: img5 },
                ].map((u, i) => (
                    <div key={u.name} className="leaderboard-item">
                        <span className="leaderboard-rank">#{i + 1}</span>
                        <img src={u.avatar} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1c19' }}>{u.name}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#d4af37', fontSize: '0.85rem' }}>{u.pts}</div>
                    </div>
                ))}
            </motion.div>
        </aside>
    </div>
);

export default Dashboard;
