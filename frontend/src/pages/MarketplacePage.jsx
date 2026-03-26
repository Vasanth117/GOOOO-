import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, Search, Filter, ShoppingCart,
    ChevronRight, Star, ShieldCheck, Leaf,
    Tag, MapPin, Plus, Package, DollarSign,
    TrendingUp, Image as ImageIcon, CheckCircle2,
    X, ArrowRight, User, History, Wallet, Ticket, UserCheck, Zap,
    Box, Truck, CreditCard, StarHalf, MessageCircle,
    ArrowLeft, Trash2, LayoutDashboard, Store,
    ThumbsUp, Share2, Award, Clock, ClipboardList,
    PieChart, Activity, AlertCircle, HardDrive, Gift,
    Leaf as SproutIcon, Wind, Droplets, Loader2,
    Mail, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const imgSeeds = 'https://images.unsplash.com/photo-1592919016383-306869a83161?q=80&w=600&auto=format&fit=crop';
const imgFertilizer = 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=600&auto=format&fit=crop';
const imgTools = 'https://images.unsplash.com/photo-1599388147417-66ec961313e9?q=80&w=600&auto=format&fit=crop';
const imgCrops = 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop';
const avatar2 = 'https://images.unsplash.com/photo-1531649666632-132d7ab266a2?auto=format&fit=crop&q=80&w=150';

const MarketplacePage = () => {
    const navigate = useNavigate();
    const { user, login, logout } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myOrders, setMyOrders] = useState([]);
    const [cart, setCart] = useState({ items: [], total_value: 0 });
    const [pointsBal, setPointsBal] = useState(0);
    const [isBuying, setIsBuying] = useState(false);

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [priceRange, setPriceRange] = useState(10000);

    // flow: 'gate' | 'buyer' | 'seller'
    const [phase, setPhase] = useState(localStorage.getItem('goo_market_phase') || 'gate');
    const [activeTab, setActiveTab] = useState('shop');

    const [showCart, setShowCart] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [sellerProfile, setSellerProfile] = useState(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    // Seller Studio State
    const [sellerTab, setSellerTab] = useState('dash');
    const [sellerLoginData, setSellerLoginData] = useState({ email: '', password: '' });
    const [isSellerLoginLoading, setIsSellerLoginLoading] = useState(false);

    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New Order', msg: 'Someone bought Organic Tomatoes!', time: '2m ago', read: false },
        { id: 2, title: 'New Review', msg: 'Anish left a 5-star rating.', time: '1h ago', read: true }
    ]);
    const [showNotifs, setShowNotifs] = useState(false);

    const [sellerDash, setSellerDash] = useState({
        total_income: 0,
        sales: 0,
        active_products: 0,
        rating: 4.8,
        daily_earnings: 0,
        monthly_earnings: 0,
        profit_breakdown: 0.85, // 85% profit margin
        inventory: [],
        recent_orders: []
    });

    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newPName, setNewPName] = useState('');
    const [newPDesc, setNewPDesc] = useState('');
    const [newPPrice, setNewPPrice] = useState('0');
    const [newPStock, setNewPStock] = useState('100');
    const [newPImg, setNewPImg] = useState('');
    const [newPCat, setNewPCat] = useState('crops');
    const [newPDiscount, setNewPDiscount] = useState(0);
    const [newPFeatured, setNewPFeatured] = useState(false);

    const [editingProduct, setEditingProduct] = useState(null);
    const [showEditProduct, setShowEditProduct] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (user) {
            if (user.role === 'seller') setPhase('seller');
        }
    }, [user]);

    const loadMarketData = async () => {
        setLoading(true);
        try {
            const data = await apiService.getProducts({
                search: searchQuery,
                category: selectedCategory,
                max_price: priceRange
            });

            // Transitioning to purely real-time production data from the backend
            const loadedProducts = data.products || [];

            setProducts(loadedProducts);

            if (phase === 'buyer') {
                const orders = await apiService.getMyOrders();
                setMyOrders(orders.orders || orders);

                try {
                    const wallet = await apiService.getWallet();
                    setPointsBal(wallet.points_balance || 0);
                } catch (e) { /* fallback if wallet not ready */ }

                const cartData = await apiService.getCart();
                setCart(cartData);
            }

            if (phase === 'seller') {
                const dash = await apiService.getSellerDashboard();
                setSellerDash(dash.data || dash);
            }
        } catch (err) {
            console.error("LayoutData Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (phase !== 'gate') {
            loadMarketData();
        }
        localStorage.setItem('goo_market_phase', phase);
    }, [phase, searchQuery, selectedCategory, priceRange]);

    const handleAddToCart = async (pId) => {
        try {
            const updatedCart = await apiService.addToCart(pId, 1);
            if (updatedCart) {
                setCart(updatedCart);
                setShowCart(true);
            } else {
                alert("This product is a demo item and cannot be added to a real cart.");
            }
        } catch (e) {
            alert("Failed to add to cart");
        }
    };

    const handleRemoveFromCart = async (pId) => {
        try {
            const updatedCart = await apiService.removeFromCart(pId);
            setCart(updatedCart);
        } catch (e) {
            alert("Failed to remove item");
        }
    };

    const handleCheckout = async (usePoints) => {
        if (cart.items.length === 0) return;
        setIsBuying(true);
        try {
            // Check out each item (Backend could support bulk, but for now individual or loop)
            for (const item of cart.items) {
                await apiService.placeOrder({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    use_points: usePoints
                });
            }
            await apiService.clearCart();
            alert('Orders Placed Successfully!');
            setShowCart(false);
            loadMarketData();
            setActiveTab('track');
        } catch (e) {
            alert('Failed to complete checkout. Check points or stock.');
        } finally {
            setIsBuying(false);
        }
    };

    const fetchFullSellerProfile = async (sId) => {
        setIsProfileLoading(true);
        try {
            const profile = await apiService.getSellerProfileFull(sId);
            setSellerProfile(profile);
        } catch (e) {
            alert("Failed to load seller journey");
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handleAddProduct = async () => {
        if (!newPName) return;
        try {
            await apiService.createProduct({
                name: newPName,
                description: newPDesc,
                category: newPCat,
                price: parseFloat(newPPrice),
                stock: parseInt(newPStock),
                image_url: newPImg,
                is_goo_verified: true,
                discount_percent: parseFloat(newPDiscount || 0),
                is_featured: newPFeatured
            });
            alert('Product published to Marketplace!');
            setShowAddProduct(false);
            loadMarketData();
            setSellerTab('inventory');
        } catch (e) {
            alert('Failed to add product.');
        }
    };

    const handleUpdateProduct = async (id, data) => {
        try {
            await apiService.updateProduct(id, data);
            loadMarketData();
            setShowEditProduct(false);
            setEditingProduct(null);
        } catch (e) {
            alert("Failed to update product");
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await apiService.deleteProduct(id);
            loadMarketData();
        } catch (e) {
            alert("Failed to delete product");
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await apiService.updateOrderStatus(orderId, newStatus);
            loadMarketData();
        } catch (e) {
            alert('Failed to update order status');
            console.error(e);
        }
    };

    /* ── 🟢 1: ENTRY PHASE (GATE) ── */
    if (phase === 'gate') {
        return (
            <motion.div className="market-gate-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="gate-container">
                    <motion.div className="gate-info-sect" initial={{ y: -30 }} animate={{ y: 0 }}>
                        <Leaf size={60} color="#2d5a27" />
                        <h1>The Green Marketplace</h1>
                        <p>Welcome to the world's first transparent eco-farming trade hub. Login to start trading.</p>
                    </motion.div>

                    <div className="gate-dual-split">
                        <motion.div className="gate-cta buyer-bg" whileHover={{ scale: 1.02 }} onClick={() => setPhase('buyer')}>
                            <div className="cta-icon"><ShoppingBag size={40} /></div>
                            <h2>Market Login</h2>
                            <p>Buy organic crops, seeds, and tools. Redeem your eco-rewards for instant discounts.</p>
                            <button className="btn-luxe-blue">Login as Buyer <ArrowRight size={18} /></button>
                        </motion.div>
                        <motion.div 
                            className="gate-cta seller-bg" 
                            whileHover={{ scale: 1.02, y: -5 }} 
                            style={{
                                cursor: 'pointer', padding: '40px', borderRadius: '30px', 
                                background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', 
                                boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #eee',
                                display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}
                        >
                            <div className="cta-icon" style={{background: '#dcfce7', color: '#166534', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}><Store size={40} /></div>
                            
                            {user?.role === 'seller' || user?.role === 'farmer' ? (
                                <div>
                                    <h2 style={{color: '#1a1c19', fontSize: '1.8rem', fontWeight: 950}}>Farmer Studio</h2>
                                    <p style={{color: '#666', marginBottom: '25px'}}>Welcome back, {user.name}! Access your real-time farm inventory and earnings dashboard.</p>
                                    <button onClick={() => navigate('/marketplace/dashboard')} className="btn-luxe-blue" style={{background: '#2d5a27', color: '#fff', padding: '15px 30px', borderRadius: '15px', border: 'none', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto'}}>
                                        OPEN DASHBOARD <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{width: '100%'}}>
                                    <h2 style={{color: '#1a1c19', fontSize: '1.8rem', fontWeight: 950}}>Farmer Studio Login</h2>
                                    <p style={{color: '#666', marginBottom: '20px', fontSize: '0.9rem'}}>Access your real-time farm inventory and earnings dashboard.</p>
                                    
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        setIsSellerLoginLoading(true);
                                        try {
                                            await login(sellerLoginData.email, sellerLoginData.password);
                                            window.location.reload(); 
                                        } catch (err) {
                                            alert("Login Failed. Verify credentials.");
                                        } finally {
                                            setIsSellerLoginLoading(false);
                                        }
                                    }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div className="auth-input-group" style={{ background: '#f4f4f2', border: '1.5px solid #eee', borderRadius: '15px', padding: '15px', display: 'flex', alignItems: 'center' }}>
                                            <Mail size={16} color="#888" style={{ marginRight: '10px' }} />
                                            <input type="email" placeholder="Business Email" required style={{ background: 'transparent', border: 'none', color: '#1a1c19', outline: 'none', width: '100%', fontWeight: 700 }}
                                                value={sellerLoginData.email} onChange={e => setSellerLoginData({ ...sellerLoginData, email: e.target.value })} />
                                        </div>
                                        <div className="auth-input-group" style={{ background: '#f4f4f2', border: '1.5px solid #eee', borderRadius: '15px', padding: '15px', display: 'flex', alignItems: 'center' }}>
                                            <Lock size={16} color="#888" style={{ marginRight: '10px' }} />
                                            <input type="password" placeholder="Password" required style={{ background: 'transparent', border: 'none', color: '#1a1c19', outline: 'none', width: '100%', fontWeight: 700 }}
                                                value={sellerLoginData.password} onChange={e => setSellerLoginData({ ...sellerLoginData, password: e.target.value })} />
                                        </div>
                                        <button className="btn-luxe-green" style={{ background: '#2d5a27', color: '#fff', padding: '18px', borderRadius: '15px', border: 'none', fontWeight: 950, marginTop: '5px', cursor: 'pointer', fontSize: '1rem' }} disabled={isSellerLoginLoading}>
                                            {isSellerLoginLoading ? 'VERIFYING...' : 'LOG IN AS FARMER'}
                                        </button>
                                        <p style={{fontSize: '0.8rem', color: '#888', fontWeight: 700}}>Don't have a business account? <span style={{color: '#2d5a27', cursor: 'pointer'}} onClick={() => navigate('/login')}>Sign Up</span></p>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="market-master-container">

            {/* ── SHARED NAVIGATION ── */}
            <header className="market-nav-premium">
                <div className="nav-sect-left">
                    <button className="btn-exit-p" onClick={() => setPhase('gate')} title="Switch View"><ArrowLeft size={18} /></button>
                    <div className="market-logo-brand">
                        <Leaf size={28} color="#2d5a27" />
                        <div><strong>GOO MARKET</strong><span>{phase.toUpperCase()} PORTAL</span></div>
                    </div>
                </div>

                <div className="nav-sect-center">
                    {phase === 'buyer' ? (
                        <div className="buyer-tabs">
                            <button className={activeTab === 'shop' ? 'active' : ''} onClick={() => setActiveTab('shop')}><LayoutDashboard size={18} /> Market</button>
                            <button className={activeTab === 'track' ? 'active' : ''} onClick={() => setActiveTab('track')}><Truck size={18} /> Tracking</button>
                            <button className={activeTab === 'rewards' ? 'active' : ''} onClick={() => setActiveTab('rewards')}><Zap size={18} /> Rewards</button>
                        </div>
                    ) : (
                        <div className="seller-tabs">
                            <button className={sellerTab === 'dash' ? 'active' : ''} onClick={() => setSellerTab('dash')}><LayoutDashboard size={18} /> Studio</button>
                            <button className={sellerTab === 'inventory' ? 'active' : ''} onClick={() => setSellerTab('inventory')}><Box size={18} /> Inventory</button>
                            <button className={sellerTab === 'sales' ? 'active' : ''} onClick={() => setSellerTab('sales')}><History size={18} /> Orders</button>
                            <button className={sellerTab === 'reviews' ? 'active' : ''} onClick={() => setSellerTab('reviews')}><MessageCircle size={18} /> Reviews</button>
                            <button className={sellerTab === 'marketing' ? 'active' : ''} onClick={() => setSellerTab('marketing')}><Share2 size={18} /> Marketing</button>
                        </div>
                    )}
                </div>

                <div className="nav-sect-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="user-hub-pill">
                        <div className="user-pts"><Star size={14} color="#d4af37" fill="#d4af37" /> {pointsBal}</div>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee', overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                            <img src={user?.avatar || avatar2} alt="V" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button onClick={() => { logout(); navigate('/login'); }} title="Sign Out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', color: '#ef4444' }}><X size={18} /></button>
                    </div>
                    {phase === 'seller' && (
                        <button className="btn-cart-pill" style={{ position: 'relative' }} onClick={() => setShowNotifs(!showNotifs)}>
                            <AlertCircle size={20} />
                            {notifications.some(n => !n.read) && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />}
                        </button>
                    )}
                    {phase === 'buyer' && (
                        <button className="btn-cart-pill" onClick={() => setShowCart(true)}>
                            <ShoppingCart size={20} />
                            {cart.items.length > 0 && <span className="cart-badge">{cart.items.length}</span>}
                        </button>
                    )}
                </div>
            </header>

            {/* Notifications Panel */}
            <AnimatePresence>
                {showNotifs && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        style={{ position: 'fixed', top: 80, right: 30, width: '300px', background: '#fff', border: '1.5px solid #eee', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', zIndex: 100, padding: '20px' }}
                    >
                        <h4 style={{ margin: '0 0 15px' }}>Business Alerts</h4>
                        {notifications.map(n => (
                            <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{n.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{n.msg}</div>
                                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>{n.time}</div>
                            </div>
                        ))}
                        <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setShowNotifs(false)}>Dismiss</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── 🛒 BUYER HUB ── */}
            {phase === 'buyer' && (
                <main className={activeTab === 'shop' ? 'market-main-grid' : 'buyer-hub-main'}>
                    {activeTab === 'shop' && (
                        <>
                            {/* Filter Sidebar */}
                            <aside className="market-sidebar-luxe">
                                <div className="search-luxe-wrap">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search crops, seeds..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <span className="sidebar-heading">Categories</span>
                                <div className="luxe-cat-grid">
                                    {[
                                        { id: 'crops', label: 'Organic Crops', icon: Leaf },
                                        { id: 'seeds', label: 'Seeds', icon: SproutIcon },
                                        { id: 'tools', label: 'Farming Tools', icon: Box },
                                        { id: 'fertilizer', label: 'Fertilizers', icon: Droplets }
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            className={`luxe-cat-tile ${selectedCategory === cat.id ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                        >
                                            <i><cat.icon size={14} /></i> {cat.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="luxe-range-container">
                                    <div className="rc-header">
                                        <h4>Max Price</h4>
                                        <span>₹{priceRange}</span>
                                    </div>
                                    <input
                                        type="range"
                                        className="luxe-slider"
                                        min="100"
                                        max="20000"
                                        step="500"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="stat-card-gold green" style={{ marginTop: '40px', padding: '24px', borderRadius: '24px' }}>
                                    <div className="sc-icon"><ShieldCheck size={24} /></div>
                                    <div>
                                        <span style={{ fontSize: '0.7rem' }}>Certified</span>
                                        <strong style={{ fontSize: '1rem' }}>Eco-Verified</strong>
                                    </div>
                                </div>
                            </aside>

                            <div className="shop-main-view">
                                <div className="market-hero-luxe">
                                    <motion.h1 initial={{ x: -20 }} animate={{ x: 0 }}>Green Trade Marketplace 🌍</motion.h1>
                                    <p>Support local sustainable farming. Get verified organic products delivered to your door with full traceability.</p>
                                    <div className="hero-stats-row">
                                        <div className="hero-stat-item">
                                            <strong>2.4k+</strong>
                                            <span>Certified Farmers</span>
                                        </div>
                                        <div className="hero-stat-item">
                                            <strong>100%</strong>
                                            <span>Organic Yield</span>
                                        </div>
                                    </div>
                                </div>

                                {!loading && products.length > 0 && (
                                    <div className="ai-reco-row">
                                        <div className="ai-header">
                                            <h3><Zap size={18} color="#fcd34d" /> Smart Recommendations</h3>
                                            <span className="ai-badge">AI Powered</span>
                                        </div>
                                        <div className="ai-grid">
                                            {products.slice(0, 4).map(p => (
                                                <div key={`rec-${p.id}`} className="ai-card" onClick={() => setSelectedProduct(p)}>
                                                    <img src={p.image_url || imgFertilizer} alt="r" />
                                                    <div className="ai-grad-overlay">
                                                        <strong>{p.name}</strong>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span>₹{p.price}</span>
                                                            <div style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>Market Top</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {loading ? (
                                    <div className="luxe-empty-state">
                                        <Loader2 className="animate-spin" size={40} />
                                        <h2>Fetching Products...</h2>
                                    </div>
                                ) : (
                                    <div className="product-wall-luxe">
                                        {products.length === 0 ? (
                                            <div className="luxe-empty-state">
                                                <i><Search size={40} /></i>
                                                <h2>No products found</h2>
                                                <p>Try adjusting your search filters or check back later.</p>
                                            </div>
                                        ) : products.map(p => (
                                            <motion.div key={p.id} className="product-card-premium" whileHover={{ y: -10 }}>
                                                <div className="pcp-img-box" onClick={() => setSelectedProduct(p)}>
                                                    <img src={p.image_url || p.img || img1} alt="p" />
                                                    <div className="pcp-badge">
                                                        <ShieldCheck size={14} /> {p.is_goo_verified ? 'Verified Organic' : 'Pending Verification'}
                                                    </div>
                                                </div>
                                                <div className="pcp-body">
                                                    <div className="pcp-seller" onClick={() => fetchFullSellerProfile(p.seller_id)}>
                                                        <User size={14} /> {p.seller_name || 'Verified Farmer'}
                                                    </div>
                                                    <h2 onClick={() => setSelectedProduct(p)}>{p.name}</h2>

                                                    <div className="pcp-footer">
                                                        <div className="pcp-price">
                                                            <span>Best Price</span>
                                                            <strong>₹{p.price}</strong>
                                                        </div>
                                                        <button
                                                            className="pcp-btn-add"
                                                            onClick={() => handleAddToCart(p.id)}
                                                            disabled={p.stock <= 0}
                                                        >
                                                            {p.stock > 0 ? <ShoppingCart size={20} /> : 'Out'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'track' && (
                        <div className="track-page-view" style={{ padding: '30px', gap: '20px', display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ color: '#1a1c19', display: 'flex', alignItems: 'center', gap: '10px' }}><Package size={24} color="#2d5a27" /> Live Active Orders</h2>
                            {myOrders.length === 0 ? <p style={{ color: '#888' }}>No active orders.</p> : myOrders.map(o => {
                                const st = o.status ? o.status.toUpperCase() : 'PENDING';
                                return (
                                    <div key={o.id} className="live-track-card" style={{ marginBottom: '20px', background: '#fff', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <div className="lt-header">
                                            <h3 style={{ color: '#1a1c19' }}>Tracking #{o.id.substring(0, 8).toUpperCase()}</h3>
                                            <div className={`status-badge ${o.status}`}>{o.status}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', paddingBottom: '15px' }}>
                                            <img src={o.product_image || 'https://images.unsplash.com/photo-1595856728082-dd58d8e5cd8d?w=100'} alt="P" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
                                            <div>
                                                <strong style={{ fontSize: '1.2rem', color: '#1a1c19' }}>{o.product_name} (x{o.quantity})</strong>
                                                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>Paid: <span style={{ color: '#2d5a27', fontWeight: '900' }}>₹{o.final_cash_price}</span></div>
                                            </div>
                                        </div>
                                        <div className="stepper-horizontal">
                                            <div className="step done"><div className="dot" /><span>Ordered</span></div>
                                            <div className={`step ${['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(st) ? 'done' : 'active'}`}><div className="dot" /><span>Packed</span></div>
                                            <div className={`step ${['SHIPPED', 'DELIVERED'].includes(st) ? 'done' : ''}`}><div className="dot" /><span>Shipped</span></div>
                                            <div className={`step ${['DELIVERED'].includes(st) ? 'done' : ''}`}><div className="dot" /><span>Arrived</span></div>
                                            <div className="track-line-progress">
                                                <div className="fill-bar" style={{ width: ['CONFIRMED'].includes(st) ? '33%' : ['SHIPPED'].includes(st) ? '66%' : ['DELIVERED'].includes(st) ? '100%' : '10%' }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="track-page-view" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="reward-promo-card" style={{ padding: '40px', background: 'linear-gradient(135deg, #2d5a27, #1e3d1a)', border: 'none', borderRadius: '24px' }}>
                                <Award size={50} color="#fcd34d" />
                                <h1 style={{ fontSize: '2.5rem', marginTop: '20px', color: '#fff' }}>Sustainable Rewards Hub</h1>
                                <p style={{ fontSize: '1.1rem', maxWidth: '600px', color: 'rgba(255,255,255,0.9)' }}>You have successfully earned points through your farming missions. Use them to lower the cost of high-quality organic seeds and tools.</p>
                                <div className="user-pts" style={{ width: 'fit-content', fontSize: '1.5rem', padding: '15px 30px', marginTop: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    Current Balance: {pointsBal} Points
                                </div>
                                <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.6)' }}>100 Points = ₹1.00 Discount</div>
                            </div>

                            <div style={{ marginTop: '30px' }}>
                                <h3>Available Organic Vouchers</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                    <div className="reward-promo-card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dotted rgba(255,255,255,0.2)' }}>
                                        <Tag size={20} />
                                        <h4>10% Off All Seeds</h4>
                                        <p>Redeem 500 Pts</p>
                                        <button className="btn-luxe-green" style={{ marginTop: '10px' }}>Acquire Voucher</button>
                                    </div>
                                    <div className="reward-promo-card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dotted rgba(255,255,255,0.2)' }}>
                                        <History size={20} />
                                        <h4>Bulk Order Discount</h4>
                                        <p>Redeem 1500 Pts</p>
                                        <button className="btn-luxe-green" style={{ marginTop: '10px', opacity: 0.5 }}>Insufficient Points</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            )}

            {/* ── 👨‍🌾 SELLER HUB ── */}
            {phase === 'seller' && (
                <main className="seller-view">
                    {sellerTab === 'dash' && (
                        <div className="seller-dash-view" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Farm Revenue & Analytics</h1>
                                <button className="btn-add-luxe" onClick={() => setShowAddProduct(true)}>
                                    <Plus size={18} /> List New Produce
                                </button>
                            </div>

                            <div className="stats-row-luxe">
                                <div className="stat-card-gold"><DollarSign size={24} /><div><strong>₹{sellerDash?.total_income || 0}</strong><span>Total Income</span></div></div>
                                <div className="stat-card-gold green"><ClipboardList size={24} /><div><strong>{sellerDash?.sales || 0}</strong><span>Total Sales</span></div></div>
                                <div className="stat-card-gold"><Package size={24} /><div><strong>{sellerDash?.stats?.total_products || 0}</strong><span>Active Products</span></div></div>
                                <div className="stat-card-gold"><Star size={24} /><div><strong>{sellerDash?.stats?.avg_rating || 5.0}</strong><span>Avg Rating</span></div></div>
                            </div>

                            {/* Revenue Chart */}
                            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                <div className="revenue-card" style={{ flex: 2, padding: '30px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 950 }}>Earnings & Profit Tracking 💰</h3>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#888' }}>TOTAL REVENUE</div>
                                                <strong style={{ fontSize: '1.2rem', color: '#2d5a27' }}>₹{sellerDash.total_income}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', height: '180px', alignItems: 'flex-end', paddingBottom: '10px' }}>
                                        {[40, 60, 45, 90, 70, 85, 100].map((h, i) => (
                                            <div key={i} style={{ flex: 1, background: i === 6 ? '#2d5a27' : '#e4e4e2', height: `${h}%`, borderRadius: '6px' }} title={`Day ${i + 1}`} />
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <div>Monthly Progress: <strong style={{ color: '#10b981' }}>+24% ↑</strong></div>
                                        <div>Est. Net Profit: <strong style={{ color: '#2d5a27' }}>₹{(sellerDash.total_income * (sellerDash.profit_breakdown || 0.8)).toFixed(0)}</strong></div>
                                    </div>
                                </div>
                                <div className="revenue-card" style={{ flex: 1, padding: '25px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Active Promotions</h4>
                                    <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534' }}>HARVEST FESTIVAL</div>
                                        <div style={{ fontSize: '0.75rem', color: '#15803d' }}>10% Auto-discount applied to all crops.</div>
                                    </div>
                                    <button className="btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem' }} onClick={() => setSellerTab('marketing')}>Manage Vouchers & Rewards</button>
                                    <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>ACCEPTED VOUCHERS</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}><Ticket size={14} color="#2d5a27" /> GOO-SUSTAIN-10 enabled</div>
                                    </div>
                                </div>
                            </div>

                            <div className="sales-graph-placeholder" style={{ marginTop: '0' }}>
                                <h3 style={{ color: '#1a1c19' }}>Recent Customer Orders</h3>
                                <div className="group-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                    {sellerDash?.recent_orders?.map(so => (
                                        <div key={so.id} style={{ background: '#fff', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '5px', color: '#1a1c19' }}>{so.product_name} (x{so.quantity})</strong>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>Date: {new Date(so.created_at).toLocaleString()}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: '#2d5a27', fontSize: '1.1rem', marginBottom: '5px' }}>₹{so.final_cash_price}</div>
                                                <div className={`status-badge ${so.status}`} style={{ display: 'inline-block' }}>{so.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!sellerDash || !sellerDash.recent_orders || sellerDash.recent_orders.length === 0) && (
                                        <p style={{ color: '#888', fontStyle: 'italic', padding: '10px 0' }}>No orders processed yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {sellerTab === 'inventory' && (
                        <div className="track-page-view" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 950 }}>Active Inventory ({sellerDash?.inventory?.length || 0})</h2>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => alert('Filter applied: Showing Low Stock only')}>
                                        <Filter size={14} /> Low Stock Only
                                    </button>
                                    <button className="btn-add-luxe" onClick={() => setShowAddProduct(true)}>
                                        <Plus size={18} /> Add New Product
                                    </button>
                                </div>
                            </div>

                            {/* Low Stock Alerts */}
                            {sellerDash?.inventory?.some(p => p.stock < 10) && (
                                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '15px 25px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <AlertCircle color="#f97316" />
                                    <div style={{ fontSize: '0.9rem', color: '#9a3412', fontWeight: 700 }}>
                                        Attention: {sellerDash.inventory.filter(p => p.stock < 10).length} products are running low on stock.
                                    </div>
                                </div>
                            )}

                            <div className="product-wall-luxe" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                                {sellerDash?.inventory?.map(p => (
                                    <div key={p.id} className="p-card-luxe" style={{ border: '1px solid var(--color-border)', background: '#fff', overflow: 'hidden', padding: 0 }}>
                                        <div style={{ height: '180px', position: 'relative' }}>
                                            <img src={p.image_url || img1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="p" />
                                            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '5px' }}>
                                                <button className="btn-action-s" onClick={() => { setEditingProduct(p); setShowEditProduct(true); }}><Edit3 size={14} /></button>
                                                <button className="btn-action-s red" onClick={() => handleDeleteProduct(p.id)}><Trash2 size={14} /></button>
                                            </div>
                                            {p.is_featured && <div style={{ position: 'absolute', top: 10, left: 10, background: '#d4af37', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900 }}>FEATURED</div>}
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name}</h4>
                                                <div style={{ fontWeight: 900, color: '#2d5a27' }}>₹{p.price}</div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>{p.category}</div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                                                <div>Stock: <strong style={{ color: p.stock < 10 ? '#ef4444' : '#1a1c19' }}>{p.stock}</strong></div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <span title="Views"><Activity size={12} /> {p.views_count || 0}</span>
                                                    <span title="Sales"><TrendingUp size={12} /> {p.sales_count || 0}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                                <button
                                                    className="btn-luxe-green"
                                                    style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}
                                                    onClick={() => handleUpdateProduct(p.id, { is_active: !p.is_active })}
                                                >
                                                    {p.is_active ? 'Hide from Store' : 'Make Visible'}
                                                </button>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: '10px' }}
                                                    onClick={() => handleUpdateProduct(p.id, { is_featured: !p.is_featured })}
                                                >
                                                    <Star size={14} fill={p.is_featured ? '#d4af37' : 'none'} color={p.is_featured ? '#d4af37' : '#888'} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {sellerTab === 'sales' && (
                        <div className="track-page-view" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 950 }}>Incoming Business Orders</h2>
                            <div className="group-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                                {sellerDash?.recent_orders?.map(so => (
                                    <div key={so.id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '10px', background: '#f4f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Package size={24} color="#2d5a27" />
                                            </div>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '1.2rem', color: '#1a1c19' }}>{so.product_name} <span style={{ fontSize: '0.9rem', color: '#666' }}>x{so.quantity}</span></strong>
                                                <div style={{ color: '#666', margin: '5px 0', fontSize: '0.85rem' }}>Buyer: <strong>{so.buyer_name}</strong> • Order ID: #{so.id.substring(0, 8).toUpperCase()}</div>
                                                <div style={{ fontWeight: '900', color: '#2d5a27', fontSize: '1.1rem' }}>₹{so.final_cash_price}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                                            <div className={`status-badge ${so.status}`}>{so.status}</div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                                <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => { setSelectedOrder(so); setShowOrderDetails(true); }}>Full Invoice</button>
                                                {so.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button className="btn-add-luxe" style={{ padding: '8px 15px', fontSize: '0.9rem' }} onClick={() => handleUpdateOrderStatus(so.id, 'confirmed')}>Accept Order</button>
                                                        <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.9rem', color: '#ef4444' }} onClick={() => handleUpdateOrderStatus(so.id, 'cancelled')}>Reject</button>
                                                    </div>
                                                )}
                                                {so.status === 'confirmed' && (
                                                    <button className="btn-luxe-green" style={{ padding: '8px 15px', fontSize: '0.9rem' }} onClick={() => handleUpdateOrderStatus(so.id, 'shipped')}>Dispatch Hero Parcel</button>
                                                )}
                                                {so.status === 'shipped' && (
                                                    <button className="btn-luxe-green" style={{ padding: '8px 15px', fontSize: '0.9rem' }} onClick={() => handleUpdateOrderStatus(so.id, 'delivered')}>Complete Delivery</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!sellerDash || !sellerDash.recent_orders || sellerDash.recent_orders.length === 0) && (
                                    <p style={{ color: '#888' }}>Waiting for new customer orders...</p>
                                )}
                            </div>
                        </div>
                    )}
                    {sellerTab === 'reviews' && (
                        <div className="track-page-view" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
                            <div className="luxe-card" style={{ padding: '40px', textAlign: 'center' }}>
                                <Star color="#d4af37" size={48} fill="#d4af37" style={{ marginBottom: '20px' }} />
                                <h2 style={{ fontSize: '2rem', fontWeight: 950 }}>Customer Feedback Hub</h2>
                                <p style={{ color: '#666', fontSize: '1.1rem' }}>You have a 4.8★ Business Rating. Maintain trust by replying to reviews.</p>
                                <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                                    {[1, 2].map(r => (
                                        <div key={r} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px', border: '1.5px solid #eee' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <strong>{r === 1 ? 'Anish' : 'Priya'} on "Organic Tomatoes"</strong>
                                                <div style={{ color: '#d4af37' }}>★★★★★</div>
                                            </div>
                                            <p style={{ margin: 0, color: '#444' }}>{r === 1 ? 'The quality is better than the local market. Truly organic!' : 'Fresh and fast delivery. Will order again.'}</p>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                                <button className="btn-add-luxe" style={{ padding: '8px 15px', fontSize: '0.85rem' }} onClick={() => navigate('/messages')}>
                                                    <MessageCircle size={14} /> Open Chat with Buyer
                                                </button>
                                                <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.85rem' }} onClick={() => alert('Reply posted publicly!')}>Post Public Response</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {sellerTab === 'marketing' && (
                        <div className="track-page-view" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
                            <div className="luxe-card" style={{ padding: '40px', background: 'linear-gradient(135deg, #2d5a27 0%, #1a3c17 100%)', color: '#fff' }}>
                                <TrendingUp size={48} style={{ marginBottom: '20px' }} />
                                <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Promote Your Farm</h2>
                                <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>Boost your product visibility in the community feed.</p>
                                <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
                                        <h4>Community Shoutout</h4>
                                        <p style={{ fontSize: '0.85rem' }}>Feature your top product in the main feed for 24h.</p>
                                        <button className="btn-luxe-green" style={{ width: '100%', background: '#fff', color: '#2d5a27' }}>Start Promo</button>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
                                        <h4>Direct Offers</h4>
                                        <p style={{ fontSize: '0.85rem' }}>Send a 10% discount voucher to your followers.</p>
                                        <button className="btn-luxe-green" style={{ width: '100%', background: '#fff', color: '#2d5a27' }}>Send Vouchers</button>
                                    </div>
                                </div>
                                <div style={{ marginTop: '30px', padding: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}><Truck size={20} /> Fulfillment & Logistics Settings 🚚</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px' }}>Default Shipping Method</label>
                                            <select style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
                                                <option>Direct Farm Delivery (Local)</option>
                                                <option>GOO Logistics Partners</option>
                                                <option>Self-Pickup Only</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px' }}>Local Radius (km)</label>
                                            <input type="number" defaultValue={25} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }} />
                                        </div>
                                    </div>
                                    <button className="btn-secondary" style={{ marginTop: '20px', background: '#fff', color: '#2d5a27', border: 'none' }}>Update Logistics Framework</button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            )}

            {/* ── MODALS & OVERLAYS ── */}
            <AnimatePresence>
                {showCart && (
                    <div className="modal-luxe-overlay" onClick={() => setShowCart(false)}>
                        <motion.div className="cart-sidebar-modal" initial={{ x: 400 }} animate={{ x: 0 }} onClick={e => e.stopPropagation()}>
                            <div className="cart-header">
                                <h3><ShoppingCart size={20} /> Your Shopping Bag</h3>
                                <button className="btn-close-pd" onClick={() => setShowCart(false)}><X /></button>
                            </div>

                            <div className="cart-items-list">
                                {cart.items.length === 0 ? (
                                    <div className="empty-cart-msg">Your bag is empty.</div>
                                ) : cart.items.map(item => (
                                    <div key={item.product_id} className="cart-item-row">
                                        <img src={item.product_image || img1} alt="p" />
                                        <div className="ci-info">
                                            <strong>{item.product_name}</strong>
                                            <div className="ci-price">₹{item.product_price} x {item.quantity}</div>
                                        </div>
                                        <button className="btn-remove-item" onClick={() => handleRemoveFromCart(item.product_id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {cart.items.length > 0 && (
                                <div className="cart-footer">
                                    <div className="cart-subtotal">
                                        <span>Subtotal</span>
                                        <strong>₹{cart.total_value}</strong>
                                    </div>
                                    <div className="points-redeem-banner">
                                        <Zap size={14} /> Use Points for discount? <span>(-₹{Math.min(pointsBal / 100, cart.total_value).toFixed(2)})</span>
                                    </div>
                                    <div className="cart-actions-column">
                                        <button className="btn-primary-checkout" onClick={() => handleCheckout(true)} disabled={isBuying}>
                                            {isBuying ? "Processing..." : "Secure Checkout (Use Points)"}
                                        </button>
                                        <button className="btn-secondary-checkout" onClick={() => handleCheckout(false)} disabled={isBuying}>
                                            Standard Checkout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {selectedProduct && (
                    <div className="modal-luxe-overlay" onClick={() => setSelectedProduct(null)}>
                        <motion.div className="product-detail-glass" initial={{ y: 50 }} animate={{ y: 0 }} onClick={e => e.stopPropagation()}>
                            <div className="pd-left">
                                <img src={selectedProduct.image_url || selectedProduct.img || img1} alt="p" className="pd-main-img" />
                                <div className="farm-transparency-card">
                                    <h3>🌱 Farm Transparency Proof</h3>
                                    <p>Trace the farming journey from seed to harvest verified by AI.</p>
                                    <div className="transparency-media-row">
                                        {sellerProfile?.posts?.filter(p => p.image_url).slice(0, 3).map((p, idx) => (
                                            <div key={idx} className="tm-item">
                                                <img src={p.image_url} alt="Proof" />
                                                <span>{p.tags?.[0] || 'Progress'}</span>
                                            </div>
                                        ))}
                                        {(!sellerProfile || (sellerProfile.posts || []).length === 0) && (
                                            <p className="no-proof-text">No verified posts found for this product's journey yet.</p>
                                        )}
                                    </div>
                                    <button className="btn-add-luxe" style={{ marginTop: '15px', background: '#2d5a27', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => fetchFullSellerProfile(selectedProduct.seller_id)}>
                                        <UserCheck size={16} /> View Farmer's Full Verification Profile <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="pd-right">
                                <button className="btn-close-pd" onClick={() => setSelectedProduct(null)}><X /></button>
                                <h1 className="pd-name">{selectedProduct.name}</h1>
                                <div className="pd-price-main">₹{selectedProduct.price}</div>
                                <p className="pd-desc">{selectedProduct.description || "Freshly grown using chemical-free methods. This product supports building a sustainable local ecosystem."}</p>
                                <div className="p-badge-row">
                                    <div className="p-badge-luxe"><ShieldCheck size={14} /> GOO Verified</div>
                                    <div className="p-badge-luxe"><Leaf size={14} /> 100% Organic</div>
                                </div>

                                {/* Farming Journey Gallery */}
                                {(selectedProduct.proof_images?.length > 0 || selectedProduct.growth_stages?.length > 0) && (
                                    <div style={{ marginTop: '25px', padding: '15px', background: '#fdfdfb', borderRadius: '16px', border: '1.5px solid #f0f0ed' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 950, color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Activity size={14} /> FARMING JOURNEY (LIVE PROOF) 🌱
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                            {selectedProduct.proof_images?.map((img, i) => (
                                                <motion.img key={i} whileHover={{ scale: 1.1 }} src={img} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer' }} />
                                            ))}
                                            {selectedProduct.growth_stages?.filter(s => s.proof).map((s, i) => (
                                                <div key={`gs-${i}`} style={{ textAlign: 'center' }}>
                                                    <motion.img whileHover={{ scale: 1.1 }} src={s.proof} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer' }} />
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, marginTop: '4px', color: '#2d5a27' }}>{s.stage}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button className="btn-primary" style={{ width: '100%', marginTop: '40px', padding: '16px' }} onClick={() => handleAddToCart(selectedProduct.id)}>
                                    Add To Bag <ShoppingCart size={18} style={{ marginLeft: 8 }} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {sellerProfile && (
                    <div className="modal-luxe-overlay" onClick={() => setSellerProfile(null)}>
                        <motion.div className="insta-profile-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '950px' }}>
                            <button className="btn-close-pd" onClick={() => setSellerProfile(null)} style={{ top: '30px', right: '30px' }}><X /></button>

                            {isProfileLoading ? (
                                <div className="loading-profile"><Loader2 className="animate-spin" /> Fetching Farm Data...</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40, padding: '40px' }}>
                                    {/* Left Side: Farm Identity */}
                                    <div style={{ borderRight: '1.5px solid #eeedeb', paddingRight: 40 }}>
                                        <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 24 }}>
                                            <img src={sellerProfile.seller_avatar || avatar2} alt="f" style={{ width: '100%', height: '100%', borderRadius: '40px', objectFit: 'cover' }} />
                                            {sellerProfile.is_goo_verified && (
                                                <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#2d5a27', color: 'white', padding: 8, borderRadius: '50%', border: '4px solid white', display: 'flex' }}>
                                                    <ShieldCheck size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: 4 }}>{sellerProfile.profile?.farm_name || sellerProfile.seller_name}</h2>
                                        <p style={{ color: '#888', fontWeight: 700, fontSize: '0.9rem', marginBottom: 20 }}>Certified Organic Since {new Date(sellerProfile.joined_at).getFullYear()}</p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #2d5a27, #1e3d1a)', borderRadius: '16px', color: 'white' }}>
                                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 800 }}>Eco-Trust Score</div>
                                                <div style={{ fontSize: '1.75rem', fontWeight: 950, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                                    {sellerProfile.eco_trust_score} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>PTS</span>
                                                </div>
                                                <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 8 }}>
                                                    <div style={{ width: `${Math.min(sellerProfile.eco_trust_score / 10, 100)}%`, height: '100%', background: '#4ade80', borderRadius: 2 }} />
                                                </div>
                                            </div>

                                            {sellerProfile.profile && (
                                                <div className="card" style={{ padding: 16, border: '1px solid #eeedeb', background: '#fdfdfd', borderRadius: 12 }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Activity size={14} color="#2d5a27" /> Farm Practice Log
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                                            <span style={{ color: '#888' }}>Soil Type</span>
                                                            <span style={{ textTransform: 'capitalize' }}>{sellerProfile.profile.soil_type}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                                            <span style={{ color: '#888' }}>Size</span>
                                                            <span>{sellerProfile.profile.farm_size_acres} Ac</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                                            <span style={{ color: '#888' }}>Method</span>
                                                            <span style={{ color: '#10b981', textTransform: 'capitalize' }}>{sellerProfile.profile.farming_practices}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Feed & Proofs */}
                                    <div>
                                        <div style={{ display: 'flex', gap: 32, borderBottom: '1.5px solid #eeedeb', marginBottom: 24 }}>
                                            <button style={{ padding: '12px 4px', background: 'transparent', border: 'none', borderBottom: '3px solid #2d5a27', fontSize: '1rem', fontWeight: 950, color: '#1a1c19' }}>Organic Journey Posts</button>
                                        </div>

                                        <div className="insta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                            {sellerProfile.posts?.filter(p => p.image_url).map((p, i) => (
                                                <motion.div key={i} className="insta-item" whileHover={{ scale: 1.05 }} style={{ borderRadius: 16, overflow: 'hidden', height: 160, border: '1px solid #eee', position: 'relative' }}>
                                                    <img src={p.image_url} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 8, color: 'white', fontSize: '0.65rem', fontWeight: 800 }}>
                                                        {p.tags?.[0] || 'Feeding'}
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {(!sellerProfile.posts || sellerProfile.posts.filter(p => p.image_url).length === 0) && (
                                                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888', padding: '40px' }}>This farmer hasn't shared any journey posts yet.</div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: 32, padding: 24, background: '#f4f4f2', borderRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '1rem', fontWeight: 950 }}>Build Trust Through Transparency</div>
                                                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem', fontWeight: 600 }}>This profile aggregates verified proof from live farming missions.</p>
                                            </div>
                                            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <UserCheck size={18} /> Follow Farming Journey
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
                {showAddProduct && (
                    <div className="modal-luxe-overlay" onClick={() => setShowAddProduct(false)}>
                        <motion.div className="insta-profile-modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 40px 100px rgba(0,0,0,0.1)', padding: '30px', borderRadius: '16px' }}>
                            <div className="insta-header" style={{ borderBottom: '1.5px solid var(--color-border)', paddingBottom: '15px', color: '#1a1c19' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', margin: 0, color: '#1a1c19' }}><Store size={22} color="#2d5a27" /> Add New Store Product</h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Product Name</label>
                                        <input type="text" style={{ width: '100%', background: '#f9f9f9', padding: '14px', color: '#1a1c19', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} value={newPName} onChange={e => setNewPName(e.target.value)} placeholder="e.g. Organic Tomatoes" />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Product Image</label>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input type="text" style={{ flex: 1, background: '#f9f9f9', padding: '14px', color: '#1a1c19', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }} value={newPImg} onChange={e => setNewPImg(e.target.value)} placeholder="Image URL..." />
                                        <input type="file" accept="image/*" id="file-upload" style={{ display: 'none' }} onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setNewPImg(reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: '#2d5a27', padding: '14px 18px', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            <ImageIcon size={18} /> Upload Local
                                        </label>
                                        {newPImg && <img src={newPImg} alt="preview" style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Price (₹)</label>
                                        <input type="number" style={{ width: '100%', background: '#fff', padding: '14px', color: '#1a1c19', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} value={newPPrice} onChange={e => setNewPPrice(e.target.value)} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Discount (%)</label>
                                        <input type="number" style={{ width: '100%', background: '#f5f5f5', padding: '14px', color: '#1a1c19', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} value={newPDiscount} onChange={e => setNewPDiscount(e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Category</label>
                                        <select
                                            style={{ width: '100%', background: '#fff', padding: '14px', color: '#1a1c19', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }}
                                            value={newPCat}
                                            onChange={e => setNewPCat(e.target.value)}
                                        >
                                            <option value="crops">Raw Crops</option>
                                            <option value="seeds">Organic Seeds</option>
                                            <option value="fertilizers">Bio-Fertilizer</option>
                                            <option value="tools">Farming Tools</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Stock</label>
                                        <input type="number" style={{ width: '100%', background: '#fff', padding: '14px', color: '#1a1c19', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} value={newPStock} onChange={e => setNewPStock(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Description / Story</label>
                                    <textarea style={{ width: '100%', background: '#fff', padding: '14px', minHeight: '100px', color: '#1a1c19', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', resize: 'vertical', fontSize: '0.95rem' }} value={newPDesc} onChange={e => setNewPDesc(e.target.value)} placeholder="Tell buyers how it was grown..." />
                                </div>

                                <div>
                                    <label style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Organic Proof (Farming Process Photos)</label>
                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => alert('Feature: Linking with Camera/Post Proof...')}>
                                            <Plus size={20} color="#888" />
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', alignSelf: 'center' }}>Upload photos of growth stages & task completion.</p>
                                    </div>
                                </div>

                                <button className="btn-luxe-green" style={{ marginTop: '20px', padding: '16px', fontSize: '1.05rem', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }} onClick={handleAddProduct}>
                                    <Package size={20} /> Publish to Marketplace
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showEditProduct && editingProduct && (
                    <div className="modal-luxe-overlay" onClick={() => setShowEditProduct(false)}>
                        <motion.div className="insta-profile-modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 40px 100px rgba(0,0,0,0.1)', padding: '30px', borderRadius: '16px' }}>
                            <div className="insta-header">
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}><Edit3 size={22} color="#2d5a27" /> Edit Listing: {editingProduct.name}</h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label>Price (₹)</label>
                                        <input type="number" defaultValue={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>Stock Units</label>
                                        <input type="number" defaultValue={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                    </div>
                                </div>
                                <div>
                                    <label>Promotional Discount (%)</label>
                                    <input type="number" defaultValue={editingProduct.discount_percent} onChange={e => setEditingProduct({ ...editingProduct, discount_percent: parseFloat(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <button className="btn-luxe-green" style={{ padding: '15px' }} onClick={() => handleUpdateProduct(editingProduct.id, {
                                    price: editingProduct.price,
                                    stock: editingProduct.stock,
                                    discount_percent: editingProduct.discount_percent
                                })}>
                                    Save Changes & Sync
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showOrderDetails && selectedOrder && (
                    <div className="modal-luxe-overlay" onClick={() => setShowOrderDetails(false)}>
                        <motion.div className="insta-profile-modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', background: '#fff', overflow: 'hidden', padding: 0, borderRadius: '24px' }}>
                            <div style={{ background: '#2d5a27', padding: '30px', color: '#fff' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Order Shipment Details</h3>
                                <p style={{ margin: '5px 0 0', opacity: 0.8 }}>ID: {selectedOrder.id}</p>
                            </div>
                            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>Customer Information</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1c19' }}>{selectedOrder.buyer_name}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '5px' }}><MapPin size={14} /> {selectedOrder.shipping_address}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '5px' }}>📞 {selectedOrder.phone || 'No phone provided'}</div>
                                </div>
                                <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span>Items Summary</span>
                                        <strong>{selectedOrder.quantity}x {selectedOrder.product_name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                                        <span>Total Checkout Payout</span>
                                        <strong style={{ color: '#2d5a27' }}>₹{selectedOrder.final_cash_price}</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowOrderDetails(false)}>Close</button>
                                    <button className="btn-luxe-green" style={{ flex: 1 }} onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'shipped'); setShowOrderDetails(false); }}>Mark Shipped</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};


// ─── STYLES – ULTRA LUXURY MARKETPLACE ────────────────────────

const marketplaceStyles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');

.market-master-container {
  min-height: 100vh;
  background: #fbfdfb !important;
  color: #1a1c19 !important;
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  padding: 0 !important;
  margin: 0 !important;
}

.market-nav-premium {
  position: sticky; top: 0; z-index: 1000; height: 90px;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(25px) saturate(180%);
  border-bottom: 1.5px solid rgba(45, 90, 39, 0.08);
  display: flex !important; align-items: center; justify-content: space-between;
  padding: 0 40px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.02);
  border-radius: 0 0 32px 32px;
}

.market-logo-brand strong { font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 900; letter-spacing: -1.5px; color: #1a1c19; }
.market-logo-brand span { font-size: 0.7rem; font-weight: 800; color: #2d5a27; background: #f0fdf4; padding: 4px 10px; border-radius: 8px; margin-top: 4px; display: inline-block; }

.buyer-tabs, .seller-tabs { display: flex; gap: 8px; background: #f4f4f2; padding: 6px; border-radius: 20px; }
.buyer-tabs button, .seller-tabs button {
  padding: 10px 24px; border: none; background: transparent; border-radius: 14px;
  font-size: 0.9rem; font-weight: 800; color: #888; display: flex; align-items: center; gap: 10px;
  cursor: pointer; transition: 0.3s;
}
.buyer-tabs button.active, .seller-tabs button.active { background: #fff; color: #2d5a27; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }

.user-hub-pill { display: flex; align-items: center; gap: 12px; background: #fff; border: 1.5px solid #eeedeb; padding: 6px 15px; border-radius: 100px; }
.user-pts { font-weight: 950; color: #2d5a27; font-size: 1rem; }
.btn-cart-pill { background: #2d5a27; color: #fff; border: none; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; }
.cart-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 900; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; }

.market-main-grid { display: grid; grid-template-columns: 340px 1fr !important; gap: 50px !important; padding: 40px !important; max-width: 1700px; margin: 0 auto; }

.market-sidebar-luxe { position: sticky; top: 130px; height: fit-content; }
.search-luxe-wrap { position: relative; margin-bottom: 40px; }
.search-luxe-wrap input { width: 100%; padding: 18px 24px 18px 56px; border-radius: 20px; background: #fff; border: 1.5px solid #eeedeb; font-weight: 700; font-size: 1rem; transition: 0.3s; }
.search-luxe-wrap input:focus { border-color: #2d5a27; box-shadow: 0 10px 30px rgba(45,90,39,0.08); outline: none; }
.search-luxe-wrap svg { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #888; }

.sidebar-heading { font-size: 0.75rem; text-transform: uppercase; font-weight: 950; letter-spacing: 2px; color: #2d5a27; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
.sidebar-heading::after { content: ''; flex: 1; height: 1px; background: rgba(45, 90, 39, 0.1); }
.luxe-cat-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }
.luxe-cat-tile { 
  display: flex; align-items: center; gap: 15px; padding: 18px 24px; border-radius: 20px; 
  border: 1.5px solid transparent; background: rgba(255,255,255,0.6); backdrop-filter: blur(10px);
  font-size: 1rem; font-weight: 700; color: #5a5e58; cursor: pointer; transition: 0.4s;
}
.luxe-cat-tile i { width: 36px; height: 36px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
.luxe-cat-tile:hover { transform: translateX(8px); background: #fff; border-color: rgba(45, 90, 39, 0.1); color: #2d5a27; }
.luxe-cat-tile.active { background: #2d5a27; color: #fff; transform: translateX(12px); box-shadow: 0 15px 30px rgba(45,90,39,0.15); }
.luxe-cat-tile.active i { background: rgba(255,255,255,0.2); color: #fff; }

.luxe-range-container { padding: 30px; background: #fff; border: 1.5px solid #eeedeb; border-radius: 24px; }
.rc-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
.rc-header h4 { font-weight: 900; margin: 0; }
.rc-header span { color: #2d5a27; font-weight: 900; }
.luxe-slider { width: 100%; -webkit-appearance: none; height: 6px; background: #eeedeb; border-radius: 10px; }
.luxe-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; background: #2d5a27; border: 4px solid #fff; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

.market-hero-luxe { 
  background: linear-gradient(135deg, #1e3d1a 0%, #2d5a27 50%, #3a7a33 100%) !important; 
  border-radius: 48px !important; padding: 70px 100px !important; color: #fff !important; 
  margin-bottom: 60px !important; position: relative; overflow: hidden;
  box-shadow: 0 40px 80px rgba(45, 90, 39, 0.15);
}
.market-hero-luxe::after {
  content: ''; position: absolute; inset: 0; 
  background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png'); 
  opacity: 0.05; pointer-events: none;
}
.market-hero-luxe h1 { 
  font-family: 'Outfit', sans-serif !important; font-size: 4.5rem !important; 
  font-weight: 950 !important; letter-spacing: -3px !important; margin-bottom: 20px !important; 
  line-height: 0.9;
}
.market-hero-luxe p { 
  font-size: 1.2rem !important; opacity: 0.9 !important; max-width: 650px !important; 
  line-height: 1.7 !important; font-weight: 400; font-family: 'Plus Jakarta Sans', sans-serif;
}
.hero-stats-row { display: flex; gap: 50px; margin-top: 40px; }
.hero-stat-item { display: flex; flex-direction: column; gap: 4px; }
.hero-stat-item strong { font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 950; color: #fcd34d; }
.hero-stat-item span { font-size: 0.8rem; text-transform: uppercase; font-weight: 800; color: rgba(255,255,255,0.7); letter-spacing: 1px; }

.ai-reco-row { background: #fff; border: 1.5px solid #eeedeb; border-radius: 32px; padding: 30px; margin-bottom: 60px; }
.ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.ai-header h3 { font-size: 1.25rem; font-weight: 950; margin: 0; }
.ai-badge { background: #fffbe6; color: #b7791f; padding: 6px 14px; border-radius: 10px; font-size: 0.7rem; font-weight: 900; }
.ai-grid { display: grid; grid-template-columns: repeat(4, 1fr) !important; gap: 20px !important; }
.ai-card { position: relative; height: 160px; border-radius: 20px; overflow: hidden; cursor: pointer; }
.ai-card img { width: 100%; height: 100%; object-fit: cover; transition: 0.4s; }
.ai-card:hover img { transform: scale(1.1); }
.ai-grad-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px; display: flex; flex-direction: column; justify-content: flex-end; color: #fff; }

.product-wall-luxe { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; gap: 40px !important; }
.product-card-premium {
  background: #fff !important; border-radius: 24px !important; border: 1.5px solid #eeedeb !important; 
  overflow: hidden !important; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important; flex-direction: column !important;
}
.product-card-premium:hover { transform: translateY(-16px) scale(1.02); box-shadow: 0 40px 80px rgba(0,0,0,0.08); border-color: #2d5a27; }
.pcp-img-box { height: 260px; overflow: hidden; position: relative; background: #f9f9f9; }
.pcp-img-box img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
.product-card-premium:hover .pcp-img-box img { transform: scale(1.1); }
.pcp-badge { position: absolute; top: 15px; left: 15px; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); color: #2d5a27; padding: 6px 14px; border-radius: 100px; font-size: 0.65rem; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.pcp-body { padding: 24px; flex: 1; display: flex; flex-direction: column; }
.pcp-seller { 
  font-size: 0.75rem; color: #2d5a27; font-weight: 850; text-transform: uppercase; 
  margin-bottom: 12px; display: flex; align-items: center; gap: 8px; letter-spacing: 0.5px;
  cursor: pointer; transition: 0.3s; padding: 6px 10px; background: #f0fdf4; width: fit-content; border-radius: 8px;
}
.pcp-seller:hover { background: #2d5a27; color: #fff; transform: translateX(5px); box-shadow: 0 4px 12px rgba(45,90,39,0.15); }
.pcp-body h2 { font-size: 1.4rem; font-weight: 950; letter-spacing: -0.5px; margin: 0 0 16px 0; color: #1a1c19; line-height: 1.2; flex: 1; }
.pcp-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #f4f4f2; padding-top: 16px; margin-top: auto; }
.pcp-price span { font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 900; }
.pcp-price strong { font-size: 1.8rem; display: block; font-weight: 950; letter-spacing: -1px; color: #2d5a27; }
.pcp-btn-add { background: #2d5a27; color: #fff; border: none; width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; box-shadow: 0 8px 20px rgba(45,90,39,0.2); }
.pcp-btn-add:hover { background: #1e3d1a; transform: rotate(15deg) scale(1.1); }

.luxe-empty-state { padding: 100px 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.luxe-empty-state h2 { font-family: 'Outfit', sans-serif; font-size: 2.5rem; font-weight: 950; }

.modal-luxe-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(12px); z-index: 2000; display: flex; align-items: center; justify-content: center; }
.cart-sidebar-modal { position: absolute; right: 0; top: 0; bottom: 0; width: 480px; background: #fff; box-shadow: -30px 0 80px rgba(0,0,0,0.15); padding: 50px; display: flex; flex-direction: column; border-radius: 40px 0 0 40px; }
.cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px; }
.cart-header h3 { font-family: 'Outfit', sans-serif !important; font-size: 2.2rem !important; font-weight: 950 !important; margin: 0; letter-spacing: -1.5px; display: flex; align-items: center; gap: 15px; color: #1a1c19; }

.cart-items-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 30px; padding-right: 10px; margin-bottom: 40px; }
.empty-cart-msg { text-align: center; color: #888; font-weight: 800; padding: 100px 0; font-size: 1.1rem; }

.cart-item-row { display: flex; align-items: center; gap: 20px; position: relative; padding-bottom: 25px; border-bottom: 1.5px solid #f4f4f2; }
.cart-item-row img { width: 90px; height: 90px; border-radius: 18px; object-fit: cover; border: 1.5px solid #eeedeb; }
.ci-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.ci-info strong { font-size: 1.1rem; font-weight: 950; color: #1a1c19; letter-spacing: -0.5px; }
.ci-price { font-size: 0.95rem; color: #666; font-weight: 700; }
.btn-remove-item { background: #fee2e2; color: #ef4444; border: none; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
.btn-remove-item:hover { background: #ef4444; color: #fff; transform: scale(1.1); }

.cart-footer { padding-top: 30px; border-top: 1.5px solid #1a1c19; }
.cart-subtotal { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.cart-subtotal span { font-size: 1.1rem; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 1px; }
.cart-subtotal strong { font-family: 'Outfit', sans-serif; font-size: 2.5rem; font-weight: 950; color: #1a1c19; letter-spacing: -1.5px; }

.points-redeem-banner { background: #f0fdf4; border: 1.5px dashed #2d5a27; padding: 20px; border-radius: 20px; display: flex; align-items: center; gap: 12px; margin-bottom: 30px; color: #166534; font-weight: 850; font-size: 0.95rem; }
.points-redeem-banner span { color: #2d5a27; font-weight: 950; }

.cart-actions-column { display: flex; flex-direction: column; gap: 12px; }
.btn-primary-checkout { 
  background: linear-gradient(135deg, #1e3d1a 0%, #2d5a27 100%) !important; 
  color: #fff !important; border: none !important; padding: 20px !important; border-radius: 18px !important; 
  font-size: 1.05rem !important; font-weight: 950 !important; cursor: pointer !important; transition: 0.4s !important; 
  box-shadow: 0 15px 35px rgba(45,90,39,0.25) !important;
}
.btn-primary-checkout:hover { transform: translateY(-5px); box-shadow: 0 20px 45px rgba(45,90,39,0.35); }
.btn-secondary-checkout { 
  background: #f4f4f2 !important; color: #1a1c19 !important; border: 2px solid #eeedeb !important; 
  padding: 18px !important; border-radius: 18px !important; font-size: 1rem !important; font-weight: 850 !important; 
  cursor: pointer !important; transition: 0.3s !important;
}
.btn-secondary-checkout:hover { background: #fff !important; border-color: #1a1c19 !important; }

.market-gate-overlay {
  position: fixed; inset: 0; background: #fff; z-index: 5000;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.gate-container { width: 100%; max-width: 1200px; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 60px; }
.gate-info-sect { text-align: center; }
.gate-info-sect h1 { font-family: 'Outfit', sans-serif; font-size: 4rem; font-weight: 950; letter-spacing: -2px; color: #1a1c19; margin: 20px 0; }
.gate-info-sect p { font-size: 1.25rem; color: #666; max-width: 600px; }

.gate-dual-split { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; width: 100%; }
.gate-cta { 
  padding: 60px; border-radius: 40px; cursor: pointer; border: 2px solid transparent; transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex; flex-direction: column; gap: 24px;
}
.gate-cta.buyer-bg { background: #f0f9ff; border-color: #e0f2fe; }
.gate-cta.seller-bg { background: #f0fdf4; border-color: #dcfce7; }
.gate-cta:hover { transform: translateY(-15px) scale(1.02); box-shadow: 0 40px 80px rgba(0,0,0,0.06); }
.gate-cta h2 { font-size: 2.2rem; font-weight: 950; margin: 0; letter-spacing: -1px; }
.gate-cta p { font-size: 1.1rem; color: #666; line-height: 1.6; margin: 0; }
.cta-icon { width: 80px; height: 80px; border-radius: 24px; display: flex; align-items: center; justify-content: center; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

.btn-luxe-blue { background: #0ea5e9; color: #fff; border: none; padding: 18px 30px; border-radius: 16px; font-weight: 900; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s; }
.btn-luxe-green { background: #2d5a27; color: #fff; border: none; padding: 18px 30px; border-radius: 16px; font-weight: 900; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s; }

@media (max-width: 1100px) {
  .market-main-grid { grid-template-columns: 1fr !important; }
  .market-sidebar-luxe { position: static; }
  .market-hero-luxe h1 { font-size: 3rem !important; }
  .gate-dual-split { grid-template-columns: 1fr; }
}
`;

document.head.appendChild(Object.assign(document.createElement("style"), { innerHTML: marketplaceStyles }));

export default MarketplacePage;

