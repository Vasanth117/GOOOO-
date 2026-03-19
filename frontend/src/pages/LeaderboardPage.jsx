import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, Medal, Globe, MapPin, TrendingUp, 
    Search, Filter, ChevronRight, Zap, Droplets, 
    Wind, Leaf, Star, Award, Crown
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

// ─────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────
const LEADERS = [
    { id: 1, rank: 1, name: 'Lakshmi Devi', location: 'Warangal', points: 5820, avatar: img7, impact: { water: '12k L', co2: '1.2t' }, badges: 12, trend: 'up' },
    { id: 2, rank: 2, name: 'Suresh Yadav', location: 'Jaipur', points: 4510, avatar: img8, impact: { water: '9k L', co2: '0.8t' }, badges: 10, trend: 'up' },
    { id: 3, rank: 3, name: 'Priya Sharma', location: 'Nashik', points: 4210, avatar: img5, impact: { water: '8.5k L', co2: '0.9t' }, badges: 9, trend: 'down' },
    { id: 4, rank: 4, name: 'Ravi Kumar', location: 'Warangal', points: 3850, avatar: img4, impact: { water: '7k L', co2: '0.6t' }, badges: 8, trend: 'stable' },
    { id: 5, rank: 5, name: 'Amit Patel', location: 'Anand', points: 3620, avatar: img6, impact: { water: '6.5k L', co2: '0.7t' }, badges: 7, trend: 'up' },
    { id: 6, rank: 6, name: 'Meena Joshi', location: 'Almora', points: 3410, avatar: img3, impact: { water: '5k L', co2: '0.5t' }, badges: 6, trend: 'up' },
    { id: 7, rank: 7, name: 'Gopal Singh', location: 'Bikaner', points: 3100, avatar: img2, impact: { water: '4.8k L', co2: '0.4t' }, badges: 5, trend: 'down' },
    { id: 8, rank: 8, name: 'Anita Devi', location: 'Hissar', points: 2950, avatar: img1, impact: { water: '4k L', co2: '0.3t' }, badges: 5, trend: 'stable' },
    { id: 18, rank: 18, name: 'Ravi Kumar (You)', location: 'Warangal', points: 1450, avatar: img9, impact: { water: '2k L', co2: '0.2t' }, badges: 4, trend: 'up', isUser: true },
];

const LeaderboardPage = () => {
    const [scope, setScope] = useState('District'); // Local, District, State, Global
    const [timeframe, setTimeframe] = useState('Monthly'); // Weekly, Monthly, All-Time

    const topThree = LEADERS.filter(l => l.rank <= 3).sort((a,b) => a.rank - b.rank);
    const others = LEADERS.filter(l => l.rank > 3);

    // Arrange podium as 2nd, 1st, 3rd
    const podiumOrder = [topThree[1], topThree[0], topThree[2]];

    return (
        <div className="leaderboard-page">
            
            {/* ── PODIUM SECTION ── */}
            <div className="podium-container">
                {podiumOrder.map((leader, i) => {
                    const isFirst = leader.rank === 1;
                    return (
                        <motion.div 
                            key={leader.id}
                            className={`podium-spot spot-${leader.rank}`}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                        >
                            <div className="avatar-container">
                                {isFirst && <motion.div className="crown-icon" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Crown size={24} fill="#d4af37" color="#d4af37" /></motion.div>}
                                <img src={leader.avatar} alt={leader.name} className="podium-avatar" />
                                <div className="rank-badge">{leader.rank}</div>
                            </div>
                            <div className="podium-name">{leader.name}</div>
                            <div className="podium-points"><Zap size={14} /> {leader.points.toLocaleString()} pts</div>
                            <div className="podium-base" style={{ height: isFirst ? '140px' : '100px' }}>
                                <div className="podium-stats">
                                    <span>{leader.badges} Badges</span>
                                    <span>{leader.impact.water} Water</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── FILTERS ── */}
            <div className="leaderboard-controls">
                <div className="scope-tabs">
                    {['Local', 'District', 'State', 'Global'].map(s => (
                        <button 
                            key={s} 
                            className={`filter-tab ${scope === s ? 'active' : ''}`}
                            onClick={() => setScope(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="time-tabs">
                    {['Weekly', 'Monthly', 'All-Time'].map(t => (
                        <button 
                            key={t} 
                            className={`filter-tab ${timeframe === t ? 'active' : ''}`}
                            onClick={() => setTimeframe(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── LIST SECTION ── */}
            <div className="leaderboard-list">
                <div className="list-header">
                    <span className="col-rank">Rank</span>
                    <span className="col-farmer">Farmer</span>
                    <span className="col-impact">Impact</span>
                    <span className="col-points">Points</span>
                </div>
                
                <div className="list-items">
                    {others.map((leader, i) => (
                        <motion.div 
                            key={leader.id} 
                            className={`list-item ${leader.isUser ? 'user-highlight' : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className="col-rank">#{leader.rank}</div>
                            <div className="col-farmer">
                                <img src={leader.avatar} alt="" className="item-avatar" />
                                <div>
                                    <div className="item-name">{leader.name} {leader.isUser && "⭐"}</div>
                                    <div className="item-loc">📍 {leader.location}</div>
                                </div>
                            </div>
                            <div className="col-impact">
                                <div className="impact-pill"><Droplets size={12} /> {leader.impact.water}</div>
                                <div className="impact-pill"><Wind size={12} /> {leader.impact.co2}</div>
                            </div>
                            <div className="col-points">
                                <div className="points-val"><Zap size={14} color="#d4af37" /> {leader.points.toLocaleString()}</div>
                                <div className={`trend-${leader.trend}`}>{leader.trend === 'up' ? '▲' : leader.trend === 'down' ? '▼' : '▬'}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── STICKY YOUR RANK ── */}
            <motion.div 
                className="user-sticky-rank"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div className="sticky-content">
                    <span className="sticky-rank">Your Rank: #18</span>
                    <img src={img9} alt="" className="sticky-avatar" />
                    <div className="sticky-info">
                        <strong>Ravi Kumar</strong>
                        <span>Warangal District</span>
                    </div>
                    <div className="sticky-progress">
                        <div className="progress-text">Next Rank: 110 pts away</div>
                        <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: '75%' }}></div></div>
                    </div>
                    <button className="sticky-btn">View Stats</button>
                </div>
            </motion.div>
        </div>
    );
};

export default LeaderboardPage;
