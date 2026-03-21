import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gift, Trophy, Zap, Ticket, ShoppingBag, 
    History, Award, Star, TrendingUp, ShieldCheck,
    Lock, ChevronRight, CheckCircle2, Info,
    ArrowRight, Wallet, Flame, Users, Leaf, Map, Search, Filter, Loader2
} from 'lucide-react';
import { apiService } from '../services/apiService';
import avatar from '../assets/images/9.jpg';

// Import Badges Assets
import BadgeEco from '../assets/Badges/natural.png';
import BadgeWater from '../assets/Badges/award-badge.png';
import BadgeSoil from '../assets/Badges/silver-medal.png';
import BadgeClimate from '../assets/Badges/gold-medal.png';

// Import Vouchers Assets
import VoucherCard1 from '../assets/Vouchers/2556_300voucher.png';
import VoucherCard2 from '../assets/Vouchers/GiftVoucher3000.webp';
import VoucherCard3 from '../assets/Vouchers/orive-gift-card-orive-organics.webp';
import VoucherCard4 from '../assets/Vouchers/ORGANIC-INDIA-415x300.jpg';

const ALL_BADGES = [
    { id: 'badge_eco_1', name: 'Eco Beginner', desc: 'Completed your first 5 eco tasks', img: BadgeEco, color: '#2d5a27', unlock: 'Complete missions' },
    { id: 'badge_waterSaver', name: 'Water Saver', desc: 'Saved 500L of water through drip irrigation', img: BadgeWater, color: '#3b82f6', unlock: 'Save 500L Water' },
    { id: 'badge_soil', name: 'Soil Protector', desc: 'Used zero chemical fertilizers for 1 month', img: BadgeSoil, color: '#768953', unlock: '2 tasks left' },
    { id: 'badge_champion', name: 'Climate Champion', desc: 'Top 1% contributor in your district', img: BadgeClimate, color: '#d4af37', unlock: 'Reach Rank 10' }
];

const STORE_ITEMS = [
    { id: 'vo_1', title: 'Bio-Fertilizer ₹300 Off', points_cost: 800, img: VoucherCard1, cat: 'Fertilizer', description: 'Flat ₹300 off on any bulk purchase.', discount_amount: 300 },
    { id: 'vo_2', title: 'Agri-Tools Gift Voucher', points_cost: 3000, img: VoucherCard2, cat: 'Tools', description: 'Gift voucher worth high value for tools.', discount_percent: 50 },
    { id: 'vo_3', title: 'Orive Organics Card', points_cost: 500, img: VoucherCard3, cat: 'Seeds', description: 'Organic supplies special digital card.', discount_percent: 100 },
    { id: 'vo_4', title: 'Organic India Promo', points_cost: 1500, img: VoucherCard4, cat: 'Supplies', description: 'Promo code for Organic India website.', discount_percent: 20 }
];

const VOUCHERS = [
    { id: 'v1', title: '₹100 Off Organic Fertilizer', brand: 'Eco-Grow', expiry: '24 Mar 2026', value: 100, code: 'ECO100', used: false },
    { id: 'v2', title: '20% Discount on Seeds', brand: 'Bharat Seeds', expiry: '12 Apr 2026', value: 20, code: 'SEED20', used: false }
];

const HISTORY = [
    { id: 1, action: 'Completed Drip Irrigation Task', points: 150, date: 'Today' },
    { id: 2, action: '5-Day Streak Bonus', points: 50, date: 'Yesterday' },
    { id: 3, action: 'Community Water Challenge Participation', points: 100, date: '2 days ago' },
    { id: 4, action: 'Helpful Answer in Forum', points: 20, date: '3 days ago' }
];

const RewardsPage = () => {
    const [points, setPoints] = useState(0);
    const [vouchers, setVouchers] = useState([]);
    const [userBadges, setUserBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const loadData = async () => {
        try {
            const data = await apiService.getWallet();
            setPoints(data.total_points || 0);
            setVouchers(data.vouchers || []);
            setUserBadges(data.badges || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleBuyVoucher = async (item) => {
        if (points < item.points_cost) {
            alert(`Not enough points! You need ${item.points_cost - points} more points.`);
            return;
        }
        setActionLoading(item.title);
        try {
            await apiService.buyVoucher({
                title: item.title,
                description: item.description,
                points_cost: item.points_cost,
                discount_percent: item.discount_percent
            });
            await loadData();
        } catch(err) {
            alert(err.message || "Failed to redeem points.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUseVoucher = async (id) => {
        setActionLoading(id);
        try {
            await apiService.useVoucher(id);
            await loadData();
            alert("Voucher utilized successfully! The discount code has been sent to your email.");
        } catch(err) {
            alert(err.message || "Failed to use voucher.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="loading-full"><Loader2 className="spinner" /></div>;

    return (
        <div className="rewards-layout">
            
            {/* ── TOP: REWARDS SUMMARY ── */}
            <div className="rewards-summary-grid">
                <motion.div className="summary-card main" whileHover={{ y: -5 }}>
                    <div className="summary-info">
                        <div className="summary-label">Total Points Balance</div>
                        <div className="summary-val"><Wallet size={24} /> {points}</div>
                        <div className="summary-sub">Spend these in the Redeem Store 🛒</div>
                    </div>
                    <div className="summary-glow" />
                </motion.div>

                <div className="summary-card">
                    <div className="summary-label">Unlocked Badges</div>
                    <div className="summary-val"><Award size={24} color="#d4af37" /> 5 / 20</div>
                    <div className="summary-sub">Top 5% in your region 🔝</div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Available Vouchers</div>
                    <div className="summary-val"><Ticket size={24} color="#2d5a27" /> {vouchers.length}</div>
                    <div className="summary-sub">Ready for use on marketplace 🎟️</div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Current Streak</div>
                    <div className="summary-val"><Flame size={24} color="#e63946" /> 6 Days</div>
                    <div className="summary-sub">Next bonus in 1 day 🔥</div>
                </div>
            </div>

            <div className="rewards-main-content">
                
                {/* ── LEFT: BADGES & STORE ── */}
                <div className="rewards-content-left">
                    <section className="rewards-section">
                        <div className="section-header">
                            <h3 className="section-title">Achievement Badges</h3>
                            <button className="view-all-link">View All <ChevronRight size={14} /></button>
                        </div>
                        <div className="badge-grid">
                            {ALL_BADGES.map((badgeInfo) => {
                                // Check if user has earned this real-time badge
                                const hasEarned = userBadges.some(b => b.title === badgeInfo.name);
                                
                                return (
                                    <motion.div key={badgeInfo.id} className={`badge-card ${!hasEarned ? 'locked' : ''}`} whileHover={{ scale: 1.03 }}>
                                        <div className="badge-icon-wrap" style={{ 
                                            background: hasEarned ? `${badgeInfo.color}15` : '#f0f0f0',
                                            borderColor: hasEarned ? badgeInfo.color : '#eee'
                                        }}>
                                            <img src={badgeInfo.img} alt={badgeInfo.name} style={{ width: 44, height: 44, objectFit: 'contain', opacity: hasEarned ? 1 : 0.4 }} />
                                            {!hasEarned && <div className="lock-overlay"><Lock size={14} /></div>}
                                        </div>
                                        <div className="badge-name">{badgeInfo.name}</div>
                                        <div className="badge-desc">{badgeInfo.desc}</div>
                                        {!hasEarned && <div className="unlock-req">{badgeInfo.unlock}</div>}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="rewards-section">
                        <div className="section-header">
                            <h3 className="section-title">Redeem Points Store</h3>
                            <span className="section-sub">Turn your eco-points into real farming value</span>
                        </div>
                        <div className="store-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            {STORE_ITEMS.map((item, i) => (
                                <div key={i} className="store-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: 0, overflow: 'hidden' }}>
                                    <div style={{ height: '120px', background: '#f5f7f5', overflow: 'hidden' }}>
                                        <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        <div className="store-info" style={{ marginBottom: '15px' }}>
                                            <div className="store-cat" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{item.cat}</div>
                                            <div className="store-name" style={{ fontSize: '1rem', fontWeight: 900, color: '#1a1c19', lineHeight: 1.2 }}>{item.title}</div>
                                        </div>
                                        <button 
                                            className="btn-redeem"
                                            style={{ opacity: points < item.points_cost ? 0.5 : 1, width: '100%' }}
                                            onClick={() => handleBuyVoucher(item)}
                                            disabled={actionLoading === item.title}
                                        >
                                            {actionLoading === item.title ? <Loader2 size={16} className="spinner" /> : `${item.points_cost} pts`}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── RIGHT: WALLET & VOUCHERS ── */}
                <aside className="rewards-content-right">
                    
                    <div className="wallet-history-card">
                        <div className="widget-title"><History size={18} /> Points History</div>
                        <div className="history-list">
                            {HISTORY.map(h => (
                                <div key={h.id} className="history-item">
                                    <div className="h-info">
                                        <div className="h-action">{h.action}</div>
                                        <div className="h-date">{h.date}</div>
                                    </div>
                                    <div className="h-pts">+{h.points}</div>
                                </div>
                            ))}
                        </div>
                        <button className="view-full-history">View Full Ledger</button>
                    </div>

                    <div className="vouchers-widget">
                        <div className="widget-title"><Ticket size={18} /> Active Vouchers</div>
                        {vouchers.length === 0 && (
                            <div style={{ padding: 20, textAlign: 'center', background: '#f8faf8', borderRadius: 12, fontSize: '0.85rem', color: '#888', border: '1px dashed #d1e2d1' }}>
                                No active vouchers found. <br/> Redeem your points!
                            </div>
                        )}
                        {vouchers.map(v => (
                            <motion.div key={v.id} className="voucher-card" whileHover={{ x: 5 }}>
                                <div className="v-cutout" />
                                <div className="v-brand">GOO Market</div>
                                <div className="v-title">{v.title}</div>
                                <div className="v-expiry">Expires: {new Date(v.expires_at).toLocaleDateString()}</div>
                                <div className="v-footer">
                                    <div className="v-code">Cost: {v.points_cost} pts</div>
                                    <button 
                                        className="btn-use-v"
                                        onClick={() => handleUseVoucher(v.id)}
                                        disabled={actionLoading === v.id}
                                    >
                                        {actionLoading === v.id ? <Loader2 size={14} className="spinner" /> : 'Use Now'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="streak-progress-card">
                        <div className="streak-header">
                            <Flame size={20} color="#e63946" />
                            <span>Streak Progress</span>
                        </div>
                        <div className="streak-bars">
                            {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                <div key={d} className={`streak-dot ${d <= 6 ? 'active' : ''}`} />
                            ))}
                        </div>
                        <div className="streak-msg">Day 7 Reward: <strong>+100 Bonus XP</strong></div>
                    </div>

                </aside>

            </div>

        </div>
    );
};

export default RewardsPage;
