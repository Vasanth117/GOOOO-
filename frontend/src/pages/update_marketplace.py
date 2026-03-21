import re

with open(r'e:\GOO\frontend\src\pages\MarketplacePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update states and load logic
content = re.sub(
r'    const \[products, setProducts\] = useState\(\[\]\);\n    const \[loading, setLoading\] = useState\(true\);\n.*?\n    \}, \[\]\);',
"""    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myOrders, setMyOrders] = useState([]);
    const [sellerDash, setSellerDash] = useState(null);
    const [pointsBal, setPointsBal] = useState(0);
    const [isBuying, setIsBuying] = useState(false);
    
    // phase: 'gate' | 'buyer' | 'seller'
    const [phase, setPhase] = useState('gate');
    const [activeTab, setActiveTab] = useState('shop'); // For Buyer
    const [sellerTab, setSellerTab] = useState('dash'); // For Seller

    const [showCart, setShowCart] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showSellerProfile, setShowSellerProfile] = useState(null);
    const [showAddProduct, setShowAddProduct] = useState(false);
    
    // Form states for adding product
    const [newPName, setNewPName] = useState('');
    const [newPPrice, setNewPPrice] = useState('');
    const [newPStock, setNewPStock] = useState('10');
    const [newPDesc, setNewPDesc] = useState('');
    const [newPImg, setNewPImg] = useState('https://images.unsplash.com/photo-1595856728082-dd58d8e5cd8d?auto=format&fit=crop&q=80&w=200');

    const loadMarketData = async () => {
        try {
            const data = await apiService.getProducts();
            setProducts(data.products || []);
            
            if (phase === 'buyer') {
                apiService.getMyOrders().then(setMyOrders).catch(console.error);
                apiService.getWallet().then(w => setPointsBal(w.points_balance || 0)).catch(console.error);
            } else if (phase === 'seller') {
                apiService.getSellerDashboard().then(setSellerDash).catch(console.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (phase !== 'gate') {
            loadMarketData();
            const interval = setInterval(loadMarketData, 30000);
            return () => clearInterval(interval);
        }
    }, [phase]);

    const handleBuy = async (usePoints) => {
        if (!selectedProduct) return;
        setIsBuying(true);
        try {
            await apiService.placeOrder({
                product_id: selectedProduct.id,
                quantity: 1,
                use_points: usePoints
            });
            alert('Order Placed Successfully! Tracking page will update.');
            setSelectedProduct(null);
            loadMarketData();
            setActiveTab('track');
        } catch(e) {
            alert('Failed to place order. Ensure sufficient points/stock.');
        } finally {
            setIsBuying(false);
        }
    };

    const handleAddProduct = async () => {
        if (!newPName) return;
        try {
            await apiService.createProduct({
                name: newPName,
                description: newPDesc,
                category: 'Organic Crops',
                price: parseFloat(newPPrice),
                stock: parseInt(newPStock),
                image_url: newPImg,
                is_goo_verified: true
            });
            alert('Product published to Marketplace!');
            setShowAddProduct(false);
            loadMarketData();
            setSellerTab('inventory');
        } catch(e) {
            alert('Failed to add product.');
        }
    };""", content, flags=re.DOTALL)

# 2. Update Buyer Pts Nav
content = content.replace('<div className="user-pts">1,250 Pts</div>', '<div className="user-pts">{pointsBal} Pts</div>')

# 3. Product mapping updates
content = re.sub(
r'<div className="product-wall-luxe">.*?</div>\s*</div>',
"""<div className="product-wall-luxe">
                                    {products.map(p => (
                                        <motion.div key={p.id} className="p-card-luxe" whileHover={{ y: -8 }} onClick={() => setSelectedProduct(p)}>
                                            <div className="p-card-img-c">
                                                <img src={p.image_url || p.img} alt="p" />
                                                <div className="badge-verify">Verified Organic</div>
                                            </div>
                                            <div className="p-card-content">
                                                <div className="pc-seller" onClick={(e) => {e.stopPropagation(); setShowSellerProfile(p.seller_id || p.seller);}}>
                                                    <MapPin size={12} /> Farm Vendor
                                                </div>
                                                <h4>{p.name}</h4>
                                                <div className="pc-price-bar">
                                                    <div className="price-main">₹{p.price}</div>
                                                    <div className="price-reward">Use Points</div>
                                                </div>
                                                <button className="btn-add-luxe">View Journey <ArrowRight size={14} /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>""", content, flags=re.DOTALL)

# 4. Tracking Hub Integration
content = re.sub(
r'<div className="track-page-view">.*?</div>\s*</div>',
"""<div className="track-page-view" style={{padding: '30px', gap: '20px', display: 'flex', flexDirection: 'column'}}>
                            <h2>Live Active Orders</h2>
                            {myOrders.length === 0 ? <p style={{color: '#888'}}>No active orders.</p> : myOrders.map(o => {
                                const st = o.status ? o.status.toUpperCase() : 'PENDING';
                                return (
                                <div key={o.id} className="live-track-card" style={{marginBottom: '20px'}}>
                                    <div className="lt-header"><h3>Tracking #{o.id.substring(0,8).toUpperCase()}</h3><div className="status-badge transit">{o.status}</div></div>
                                    <div style={{display:'flex', gap:'15px', alignItems:'center', paddingBottom: '15px'}}>
                                        <img src={o.product_image || 'https://images.unsplash.com/photo-1595856728082-dd58d8e5cd8d?w=100'} alt="P" style={{width: 60, height:60, borderRadius: 10, objectFit:'cover'}} />
                                        <div>
                                            <strong style={{fontSize: '1.1rem'}}>{o.product_name} (x{o.quantity})</strong>
                                            <div style={{color:'#666', fontSize:'0.9rem', marginTop: '5px'}}>Paid: ₹{o.final_cash_price}</div>
                                        </div>
                                    </div>
                                    <div className="stepper-horizontal">
                                        <div className="step done"><div className="dot" /><span>Ordered</span></div>
                                        <div className={`step ${['CONFIRMED','SHIPPED','DELIVERED'].includes(st) ? 'done' : 'active'}`}><div className="dot" /><span>Packed</span></div>
                                        <div className={`step ${['SHIPPED','DELIVERED'].includes(st) ? 'done' : ''}`}><div className="dot" /><span>Shipped</span></div>
                                        <div className={`step ${['DELIVERED'].includes(st) ? 'done' : ''}`}><div className="dot" /><span>Arrived</span></div>
                                        <div className="track-line-progress">
                                            <div className="fill-bar" style={{width: ['CONFIRMED'].includes(st) ? '33%' : ['SHIPPED'].includes(st) ? '66%' : ['DELIVERED'].includes(st) ? '100%' : '10%'}} />
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>""", content, flags=re.DOTALL)

# 5. Seller Hub Dashboard Integration
content = re.sub(
r'<div className="seller-dash-view">.*?</div>\s*\)',
"""<div className="seller-dash-view">
                            <div className="stats-row-luxe">
                                <div className="stat-card-gold"><DollarSign size={24} /><div><strong>₹{sellerDash?.total_income || 0}</strong><span>Total Income</span></div></div>
                                <div className="stat-card-gold green"><ClipboardList size={24} /><div><strong>{sellerDash?.sales || 0}</strong><span>Total Sales</span></div></div>
                                <div className="stat-card-gold"><Package size={24} /><div><strong>{sellerDash?.products?.length || 0}</strong><span>Active Products</span></div></div>
                            </div>
                            <div className="sales-graph-placeholder" style={{marginTop: '30px', height: 'auto', background: 'transparent'}}>
                                <h3>Total Orders Received ({sellerDash?.recent_orders?.length || 0})</h3>
                                <div className="group-list" style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px'}}>
                                    {sellerDash?.recent_orders?.map(so => (
                                        <div key={so.id} style={{background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)'}}>
                                            <div>
                                                <strong style={{display: 'block', fontSize: '1rem', marginBottom: '5px'}}>{so.product_name} (x{so.quantity})</strong>
                                                <div style={{fontSize: '0.8rem', color: '#888'}}>Date: {new Date(so.created_at).toLocaleString()}</div>
                                            </div>
                                            <div style={{textAlign: 'right'}}>
                                                <div style={{fontWeight: 'bold', color: '#d4af37', fontSize: '1.1rem', marginBottom: '5px'}}>₹{so.final_cash_price}</div>
                                                <div style={{fontSize: '0.75rem', background: '#2d5a27', color: 'white', padding: '2px 8px', borderRadius: '4px', display:'inline-block', fontWeight: 'bold'}}>{so.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!sellerDash || !sellerDash.recent_orders || sellerDash.recent_orders.length === 0) && (
                                        <p style={{color: '#888', fontStyle: 'italic', padding: '10px 0'}}>No orders processed yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )""", content, flags=re.DOTALL)

# 6. Purchase Buttons Logic
content = content.replace(
"""<button className="btn-luxe-green" style={{width: '100%', marginTop: '40px'}}>Buy with Points Discount</button>""",
"""<button className="btn-luxe-green" style={{width: '100%', marginTop: '40px', opacity: isBuying ? 0.5 : 1}} disabled={isBuying} onClick={() => handleBuy(true)}>{isBuying ? 'Processing...' : 'Buy with Points Discount 💰'}</button>
<button className="btn-add-luxe" style={{width: '100%', marginTop: '10px', height: '45px'}} disabled={isBuying} onClick={() => handleBuy(false)}>Buy Normally (₹{selectedProduct?.price})</button>"""
)

# 7. Add Product Modal Injection
content = re.sub(
r'        </div>\n    \);\n};\n\nexport default MarketplacePage;\n*',
"""            <AnimatePresence>
                {showAddProduct && (
                    <div className="modal-luxe-overlay" onClick={() => setShowAddProduct(false)}>
                        <motion.div className="insta-profile-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} style={{maxWidth: '500px', background: '#1c1c1c'}}>
                            <div className="insta-header" style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px'}}>
                                <h2><Store size={20} /> Add New Store Product</h2>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px'}}>
                                <div>
                                    <label style={{color: '#ccc', fontSize: '0.85rem'}}>Product Name</label>
                                    <input type="text" className="fake-input-btn" style={{width: '100%', background: 'rgba(0,0,0,0.2)', padding:'10px', marginTop:'5px', color:'white', border:'1px solid #333'}} value={newPName} onChange={e=>setNewPName(e.target.value)} />
                                </div>
                                <div style={{display: 'flex', gap: '15px'}}>
                                    <div style={{flex: 1}}>
                                        <label style={{color: '#ccc', fontSize: '0.85rem'}}>Price (₹)</label>
                                        <input type="number" className="fake-input-btn" style={{width: '100%', background: 'rgba(0,0,0,0.2)', padding:'10px', marginTop:'5px', color:'white', border:'1px solid #333'}} value={newPPrice} onChange={e=>setNewPPrice(e.target.value)} />
                                    </div>
                                    <div style={{flex: 1}}>
                                        <label style={{color: '#ccc', fontSize: '0.85rem'}}>Stock Amount</label>
                                        <input type="number" className="fake-input-btn" style={{width: '100%', background: 'rgba(0,0,0,0.2)', padding:'10px', marginTop:'5px', color:'white', border:'1px solid #333'}} value={newPStock} onChange={e=>setNewPStock(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{color: '#ccc', fontSize: '0.85rem'}}>Description / Story</label>
                                    <textarea className="fake-input-btn" style={{width: '100%', background: 'rgba(0,0,0,0.2)', padding:'10px', marginTop:'5px', minHeight: '80px', color:'white', border:'1px solid #333'}} value={newPDesc} onChange={e=>setNewPDesc(e.target.value)} />
                                </div>
                                <button className="btn-luxe-green" style={{marginTop: '10px'}} onClick={handleAddProduct}>Publish to Marketplace</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default MarketplacePage;
""", content)

with open(r'e:\GOO\frontend\src\pages\MarketplacePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
