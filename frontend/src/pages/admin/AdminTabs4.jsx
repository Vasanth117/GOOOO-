import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, DollarSign, Store, Eye, EyeOff, Tag } from 'lucide-react';
import { adminFetch, SectionHeader, StatCard, StatusBadge } from './adminUtils';

export const MarketplaceTab = () => {
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [statsRes, productsRes] = await Promise.all([
                adminFetch('/admin/marketplace/stats'),
                adminFetch('/admin/marketplace/products?limit=50')
            ]);
            setStats(statsRes);
            setProducts(productsRes.products || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const toggleStatus = async (productId, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'hide' : 'show'} this product?`)) return;
        try {
            await adminFetch(`/admin/marketplace/products/${productId}/status?is_active=${!currentStatus}`, {
                method: 'PATCH',
            });
            load();
        } catch (e) {
            alert(e.message);
        }
    };

    const HEADERS = ['Product Name', 'Category', 'Seller', 'Price', 'Stock', 'Status', 'Actions'];

    return (
        <div>
            <SectionHeader title="Marketplace & Industry" sub="Monitor farmer products, industries, and marketplace listings" />
            
            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                <StatCard icon={ShoppingCart} label="Total Products" value={stats?.total_products || 0} color="#0891b2" />
                <StatCard icon={Package} label="Active Listings" value={stats?.active_products || 0} color="#16a34a" />
                <StatCard icon={Store} label="Active Sellers" value={stats?.total_sellers || 0} color="#d97706" />
                <StatCard icon={DollarSign} label="Inventory Value" value={`₹${stats?.total_inventory_value?.toLocaleString() || 0}`} color="#2d5a27" />
            </div>

            {loading ? (
                <div style={{ color: '#888', padding: 60, textAlign: 'center', fontSize: '0.9rem' }}>Loading marketplace data...</div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eeedeb', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8faf8' }}>
                                {HEADERS.map(h => (
                                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #eeedeb' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#aaa', fontWeight: 700 }}>No products listed yet</td></tr>
                            )}
                            {products.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f4f4f2', transition: 'background 0.12s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8faf8'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '13px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f8faf8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eeedeb', flexShrink: 0 }}>
                                                <Tag size={16} color="#888" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1a1c19' }}>{p.name}</div>
                                                {p.is_eco_certified && <span style={{ fontSize: '0.65rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>ECO CERTIFIED</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: '#666', textTransform: 'capitalize' }}>{p.category}</td>
                                    <td style={{ padding: '13px 16px', fontSize: '0.88rem', fontWeight: 700, color: '#2d5a27' }}>{p.seller_name}</td>
                                    <td style={{ padding: '13px 16px', fontWeight: 900, color: '#1a1c19' }}>₹{p.price}</td>
                                    <td style={{ padding: '13px 16px', fontSize: '0.88rem', color: p.stock > 0 ? '#166534' : '#dc2626', fontWeight: 800 }}>
                                        {p.stock > 0 ? `${p.stock} units` : 'Out of stock'}
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase', background: p.is_active ? '#f0fdf4' : '#fef2f2', color: p.is_active ? '#166534' : '#dc2626' }}>
                                            {p.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <button onClick={() => toggleStatus(p.id, p.is_active)}
                                            style={{ padding: '7px 12px', background: '#fff', border: `1px solid ${p.is_active ? '#fecaca' : '#bbf7d0'}`, borderRadius: 8, color: p.is_active ? '#dc2626' : '#166534', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: 'inherit' }}>
                                            {p.is_active ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
