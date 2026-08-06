import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/apiService';
import {
    Thermometer, Droplets, Wind, Activity, Zap, Server, ShieldCheck, RefreshCw, Cpu
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const HardwareSensorsPage = () => {
    const [farmProfile, setFarmProfile] = useState(null);
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    
    const fetchInterval = useRef(null);

    const loadData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setIsRefreshing(true);
        setError(null);
        try {
            // 1. Get Farm Profile
            let profileId = "000000000000000000000000"; // fallback
            try {
                const farmRes = await apiService.getFarmProfile();
                if (farmRes && farmRes.id) {
                    profileId = farmRes.id;
                    setFarmProfile(farmRes);
                }
            } catch (err) {
                console.warn("Farm profile not found, using default demo ID");
            }

            // 2. Get Telemetry
            let teleRes = await apiService.getTelemetry(profileId, 20);
            
            // If no data found for the real profile, check the default test profile
            if ((!teleRes || teleRes.length === 0) && profileId !== "000000000000000000000000") {
                teleRes = await apiService.getTelemetry("000000000000000000000000", 20);
            }

            if (teleRes && teleRes.length > 0) {
                // Reverse to have oldest first for chart
                setTelemetry(teleRes.reverse());
            } else {
                setTelemetry([]);
            }
        } catch (err) {
            console.error("Hardware fetch error:", err);
            setError(err.message || "Failed to connect to hardware sensors.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
        
        // Polling every 5 seconds
        fetchInterval.current = setInterval(() => {
            loadData(true);
        }, 5000);

        return () => {
            if (fetchInterval.current) clearInterval(fetchInterval.current);
        };
    }, []);

    const latestData = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

    // Formatting chart data
    const chartData = telemetry.map(t => ({
        time: new Date(t.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        temperature: t.temperature_c,
        humidity: t.humidity_percent,
        moisture: t.moisture_percent
    }));

    // Status calculations
    const getStatusInfo = (value, type) => {
        if (value == null) return { color: '#888', text: 'N/A' };
        if (type === 'temp') {
            if (value > 35) return { color: '#ef4444', text: 'Too Hot' };
            if (value < 10) return { color: '#3b82f6', text: 'Too Cold' };
            return { color: '#10b981', text: 'Optimal' };
        }
        if (type === 'hum') {
            if (value > 80) return { color: '#3b82f6', text: 'High' };
            if (value < 30) return { color: '#ef4444', text: 'Dry' };
            return { color: '#10b981', text: 'Optimal' };
        }
        if (type === 'moist') {
            if (value < 20) return { color: '#ef4444', text: 'Critical Dry' };
            if (value > 70) return { color: '#3b82f6', text: 'Overwatered' };
            return { color: '#10b981', text: 'Optimal' };
        }
        return { color: '#888', text: 'Normal' };
    };

    return (
        <motion.div 
            className="hardware-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ maxWidth: 1200, margin: '0 auto' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1c19', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Cpu size={32} color="#2d5a27" /> IoT Sensor Network
                    </h1>
                    <p style={{ color: '#666', fontWeight: 600, marginTop: 4 }}>Live telemetry from your physical farm hardware.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: isRefreshing ? '#e0f2fe' : '#dcfce7', padding: '8px 16px', borderRadius: 20, color: isRefreshing ? '#0284c7' : '#166534', fontWeight: 700, fontSize: '0.85rem', transition: '0.3s' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isRefreshing ? '#0ea5e9' : '#22c55e', animation: isRefreshing ? 'pulse 1s infinite' : 'none' }} />
                        {isRefreshing ? 'Syncing...' : 'Connected'}
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 16, borderRadius: 12, marginBottom: 24, fontWeight: 600 }}>
                    Error: {error}
                </div>
            )}

            {!loading && !latestData && !error && (
                <div style={{ padding: 60, textAlign: 'center', background: 'white', borderRadius: 24, border: '1px dashed #ccc' }}>
                    <Server size={48} color="#aaa" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No Telemetry Data</h3>
                    <p style={{ color: '#666' }}>Ensure your ESP32 hardware is powered on and connected to Wi-Fi.</p>
                </div>
            )}

            {latestData && (
                <>
                    {/* Top KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
                        {/* Temperature Card */}
                        <motion.div 
                            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(239, 68, 68, 0.15)' }}
                            style={{ 
                                background: 'linear-gradient(135deg, #fff 0%, #fff5f5 100%)', 
                                padding: 24, borderRadius: 24, 
                                border: '1px solid #fee2e2', position: 'relative', overflow: 'hidden' 
                            }}
                        >
                            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'rotate(15deg)' }}>
                                <Thermometer size={160} color="#ef4444" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Thermometer size={24} />
                                </div>
                                <div style={{ background: getStatusInfo(latestData.temperature_c, 'temp').color + '20', color: getStatusInfo(latestData.temperature_c, 'temp').color, padding: '4px 12px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem' }}>
                                    {getStatusInfo(latestData.temperature_c, 'temp').text}
                                </div>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <div style={{ color: '#888', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Temperature</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1a1c19', letterSpacing: -1 }}>
                                        {latestData.temperature_c.toFixed(1)}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#666' }}>°C</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Humidity Card */}
                        <motion.div 
                            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.15)' }}
                            style={{ 
                                background: 'linear-gradient(135deg, #fff 0%, #eff6ff 100%)', 
                                padding: 24, borderRadius: 24, 
                                border: '1px solid #dbeafe', position: 'relative', overflow: 'hidden' 
                            }}
                        >
                            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'rotate(-15deg)' }}>
                                <Wind size={160} color="#3b82f6" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Wind size={24} />
                                </div>
                                <div style={{ background: getStatusInfo(latestData.humidity_percent, 'hum').color + '20', color: getStatusInfo(latestData.humidity_percent, 'hum').color, padding: '4px 12px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem' }}>
                                    {getStatusInfo(latestData.humidity_percent, 'hum').text}
                                </div>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <div style={{ color: '#888', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Air Humidity</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1a1c19', letterSpacing: -1 }}>
                                        {latestData.humidity_percent.toFixed(1)}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#666' }}>%</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Soil Moisture Card */}
                        <motion.div 
                            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15)' }}
                            style={{ 
                                background: 'linear-gradient(135deg, #fff 0%, #ecfdf5 100%)', 
                                padding: 24, borderRadius: 24, 
                                border: '1px solid #d1fae5', position: 'relative', overflow: 'hidden' 
                            }}
                        >
                            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'rotate(5deg)' }}>
                                <Droplets size={160} color="#10b981" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Droplets size={24} />
                                </div>
                                <div style={{ background: getStatusInfo(latestData.moisture_percent, 'moist').color + '20', color: getStatusInfo(latestData.moisture_percent, 'moist').color, padding: '4px 12px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem' }}>
                                    {getStatusInfo(latestData.moisture_percent, 'moist').text}
                                </div>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <div style={{ color: '#888', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Soil Moisture</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1a1c19', letterSpacing: -1 }}>
                                        {latestData.moisture_percent.toFixed(1)}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#666' }}>%</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Charts Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
                        
                        {/* Live Graph */}
                        <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid #eeedeb', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1a1c19' }}>Real-Time Timeline</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#888', fontWeight: 600 }}>Tracking environmental changes over time</p>
                                </div>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}/> Temp
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }}/> Humid
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}/> Moist
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: 350, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorHumid" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorMoist" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#888', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#888', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                            itemStyle={{ fontWeight: 800 }}
                                        />
                                        <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                                        <Area type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumid)" />
                                        <Area type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMoist)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Node Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ background: '#1a1c19', color: 'white', padding: 24, borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.1 }}>
                                    <Activity size={180} />
                                </div>
                                <h3 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <ShieldCheck color="#10b981" /> System Health
                                </h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#aaa', fontWeight: 600 }}>Node Status</span>
                                        <span style={{ background: '#10b98120', color: '#10b981', padding: '4px 12px', borderRadius: 12, fontWeight: 800, fontSize: '0.8rem' }}>ONLINE</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#aaa', fontWeight: 600 }}>Uptime</span>
                                        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>99.9%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#aaa', fontWeight: 600 }}>Last Ping</span>
                                        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>{new Date(latestData.recorded_at).toLocaleTimeString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#aaa', fontWeight: 600 }}>Signal Strength</span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {[1,2,3,4].map(i => <div key={i} style={{ width: 4, height: 12, background: '#10b981', borderRadius: 4 }} />)}
                                            <div style={{ width: 4, height: 12, background: '#444', borderRadius: 4 }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid #eeedeb', display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#f4f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Zap size={24} color="#f59e0b" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 900, color: '#1a1c19' }}>AI Agronomist Active</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, marginTop: 4 }}>Monitoring for anomalies & crop health</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default HardwareSensorsPage;
