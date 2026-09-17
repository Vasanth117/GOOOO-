import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSensorData } from '../hooks/useSensorData';
import SensorCard from '../components/SensorCard';
import LiveChart from '../components/LiveChart';
import { 
    Thermometer, Droplets, Wind, Activity, Zap, ShieldCheck, Cpu, CloudRain, Sun, Battery, Wifi, Brain,
    Bug, X, AlertTriangle, CheckCircle2, TrendingUp, Leaf, ShieldAlert, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

// ─── RISK GAUGE COMPONENT ───────────────────────────────────────
const RiskGauge = ({ score, level }) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f59e0b' : '#10b981';
    const bgColor = level === 'HIGH' ? '#fef2f2' : level === 'MEDIUM' ? '#fffbeb' : '#f0fdf4';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={65} cy={65} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={10} />
                <motion.circle 
                    cx={65} cy={65} r={radius} fill="none" 
                    stroke={color} strokeWidth={10} strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
                <text 
                    x={65} y={65} textAnchor="middle" dominantBaseline="central" 
                    fill={color} fontSize="28" fontWeight="900"
                    style={{ transform: 'rotate(90deg)', transformOrigin: '65px 65px' }}
                >
                    {score}
                </text>
            </svg>
            <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                style={{ 
                    background: bgColor, color, padding: '6px 20px', borderRadius: 20,
                    fontWeight: 900, fontSize: '0.85rem', letterSpacing: 1,
                    border: `2px solid ${color}`,
                    animation: level === 'HIGH' ? 'pulse 2s infinite' : 'none',
                }}
            >
                {level} RISK
            </motion.div>
        </div>
    );
};

// ─── FACTOR ROW COMPONENT ───────────────────────────────────────
const FactorRow = ({ factor, index }) => {
    const barPercent = (factor.points / factor.max_points) * 100;
    const color = factor.triggered ? (barPercent >= 80 ? '#ef4444' : '#f59e0b') : '#10b981';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            style={{ 
                background: factor.triggered ? `${color}08` : '#fafbfa',
                padding: '14px 18px', borderRadius: 16, 
                border: `1.5px solid ${factor.triggered ? `${color}30` : '#e8eee8'}`,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {factor.triggered 
                        ? <AlertTriangle size={16} color={color} /> 
                        : <CheckCircle2 size={16} color="#10b981" />
                    }
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a1c19' }}>{factor.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 900, fontSize: '0.85rem', color }}>{factor.value}</span>
                    <span style={{ 
                        background: `${color}20`, color, padding: '2px 10px', borderRadius: 8,
                        fontWeight: 800, fontSize: '0.7rem',
                    }}>
                        +{factor.points}
                    </span>
                </div>
            </div>
            {/* Score bar */}
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${barPercent}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    style={{ height: '100%', background: color, borderRadius: 4 }}
                />
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#666', lineHeight: 1.4, fontWeight: 500 }}>
                {factor.reason}
            </p>
        </motion.div>
    );
};


// ─── DISEASE RISK MODAL ─────────────────────────────────────────
const DiseaseRiskModal = ({ result, onClose }) => {
    if (!result) return null;

    const levelColor = result.risk_level === 'HIGH' ? '#ef4444' : result.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981';

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: 20, backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.85, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto',
                    background: 'white', borderRadius: 32,
                    boxShadow: '0 40px 120px rgba(0,0,0,0.35)',
                }}
            >
                {/* ── Header ── */}
                <div style={{
                    background: `linear-gradient(135deg, #1a1c19 0%, ${levelColor}30 100%)`,
                    padding: '30px 32px 24px', borderRadius: '32px 32px 0 0',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.06 }}>
                        <Bug size={200} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <ShieldAlert size={22} color={levelColor} />
                                <h2 style={{ margin: 0, color: 'white', fontWeight: 950, fontSize: '1.5rem' }}>
                                    Disease Risk Forecast
                                </h2>
                            </div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>
                                {result.weather?.location || 'Your Farm'} • {new Date().toLocaleString()}
                            </p>
                        </div>
                        <button onClick={onClose} style={{
                            border: 'none', background: 'rgba(255,255,255,0.1)', width: 40, height: 40,
                            borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <X size={18} color="white" />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* ── Risk Score Gauge + Sensor Snapshot ── */}
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                        <RiskGauge score={result.risk_score} level={result.risk_level} />
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.7rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                Sensor Readings Used
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {[
                                    { label: 'Temperature', val: `${result.sensor_input.temperature.toFixed(1)}°C`, icon: Thermometer, color: '#ef4444' },
                                    { label: 'Humidity', val: `${result.sensor_input.humidity.toFixed(0)}%`, icon: Wind, color: '#3b82f6' },
                                    { label: 'Soil Moisture', val: `${result.sensor_input.soil_moisture.toFixed(0)}%`, icon: Droplets, color: '#06b6d4' },
                                    { label: 'Rain', val: result.sensor_input.rain ? 'Active' : 'Clear', icon: CloudRain, color: result.sensor_input.rain ? '#6366f1' : '#10b981' },
                                ].map((s, i) => (
                                    <div key={i} style={{ 
                                        background: '#f8faf8', padding: '10px 12px', borderRadius: 14,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        border: '1px solid #e8eee8',
                                    }}>
                                        <s.icon size={16} color={s.color} />
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1a1c19' }}>{s.val}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Contributing Factors ── */}
                    <div>
                        <h4 style={{ margin: '0 0 12px', fontSize: '0.7rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingUp size={14} /> Contributing Factors
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {result.factors.map((f, i) => <FactorRow key={f.name} factor={f} index={i} />)}
                        </div>
                    </div>

                    {/* ── Crop-Specific Warnings ── */}
                    {result.crop_risks && result.crop_risks.length > 0 && (
                        <div>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.7rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Leaf size={14} /> Crop Disease Warnings
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                                {result.crop_risks.map((cr, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 + i * 0.1 }}
                                        style={{
                                            background: result.risk_level === 'HIGH' ? '#fef2f2' : result.risk_level === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
                                            border: `1.5px solid ${levelColor}25`,
                                            padding: '14px 16px', borderRadius: 16,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#1a1c19' }}>
                                                🌾 {cr.crop}
                                            </span>
                                            <span style={{ 
                                                background: `${levelColor}20`, color: levelColor, 
                                                padding: '2px 10px', borderRadius: 8,
                                                fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase',
                                            }}>
                                                {cr.severity}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: levelColor }}>
                                            {cr.disease}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 500, marginTop: 2 }}>
                                            {cr.pathogen}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Recommendations ── */}
                    <div>
                        <h4 style={{ margin: '0 0 12px', fontSize: '0.7rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={14} /> Recommended Actions
                        </h4>
                        <div style={{ 
                            background: '#f8faf8', borderRadius: 20, padding: '18px 20px',
                            border: '1.5px solid #e8eee8',
                            display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                            {result.recommendations.map((rec, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.0 + i * 0.1 }}
                                    style={{ 
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                        fontSize: '0.85rem', color: '#333', fontWeight: 600, lineHeight: 1.5,
                                    }}
                                >
                                    <span style={{ 
                                        minWidth: 22, height: 22, borderRadius: '50%',
                                        background: '#2d5a27', color: 'white', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.65rem', fontWeight: 900, marginTop: 1,
                                    }}>
                                        {i + 1}
                                    </span>
                                    <span>{rec}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* ── Weather Context ── */}
                    {result.weather && result.weather.temp && (
                        <div style={{ 
                            background: '#1a1c19', padding: '16px 20px', borderRadius: 18, 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            flexWrap: 'wrap', gap: 12,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CloudRain size={18} color="#60a5fa" />
                                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>
                                    Weather: {result.weather.description || result.weather.condition}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <span style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 700 }}>
                                    🌡️ {result.weather.temp?.toFixed(1)}°C
                                </span>
                                <span style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 700 }}>
                                    💧 {result.weather.humidity}%
                                </span>
                                {result.weather.wind_speed && (
                                    <span style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 700 }}>
                                        💨 {result.weather.wind_speed} m/s
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};


// ─── MAIN HARDWARE DASHBOARD PAGE ───────────────────────────────

const DashboardPage = () => {
    const sensorData = useSensorData();
    const navigate = useNavigate();
    const { 
        temperature, humidity, soilMoisture, soilPH, light, rain, 
        battery, signalStrength, timestamp, deviceStatus, history 
    } = sensorData;

    const [riskResult, setRiskResult] = useState(null);
    const [riskLoading, setRiskLoading] = useState(false);
    const [showRiskModal, setShowRiskModal] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case 'ONLINE': return '#10b981';
            case 'RECONNECTING': return '#f59e0b';
            case 'OFFLINE': return '#ef4444';
            case 'NO_DATA': return '#9ca3af';
            default: return '#9ca3af';
        }
    };

    const handleDiseaseRisk = async () => {
        setRiskLoading(true);
        try {
            const payload = {
                temperature: temperature ?? 28,
                humidity: humidity ?? 65,
                soil_moisture: soilMoisture ?? 45,
                rain: rain ?? false,
            };
            const data = await apiService.getDiseaseRiskAssessment(payload);
            setRiskResult(data);
            setShowRiskModal(true);
        } catch (err) {
            alert('Disease Risk Assessment failed: ' + err.message);
        } finally {
            setRiskLoading(false);
        }
    };

    return (
        <motion.div 
            className="hardware-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '40px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1c19', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Cpu size={32} color="#2d5a27" /> IoT Sensor Network
                    </h1>
                    <p style={{ color: '#666', fontWeight: 600, marginTop: 4 }}>Real-time telemetry from your physical farm hardware.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button 
                        onClick={() => navigate('/ai', { state: { hardwareData: sensorData } })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'linear-gradient(135deg, #2d5a27, #4ade80)',
                            color: 'white', padding: '8px 16px', borderRadius: 20,
                            fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(74, 222, 128, 0.3)'
                        }}
                    >
                        <Brain size={16} /> Get AI Advisory
                    </button>

                    <button 
                        onClick={handleDiseaseRisk}
                        disabled={riskLoading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: riskLoading 
                                ? '#ccc' 
                                : 'linear-gradient(135deg, #dc2626, #f59e0b)',
                            color: 'white', padding: '8px 16px', borderRadius: 20,
                            fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: riskLoading ? 'wait' : 'pointer',
                            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)',
                            transition: '0.3s',
                        }}
                    >
                        <Bug size={16} /> {riskLoading ? 'Analyzing...' : 'Disease Risk'}
                    </button>

                    <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 8, 
                        background: `${getStatusColor(deviceStatus)}20`, 
                        padding: '8px 16px', borderRadius: 20, 
                        color: getStatusColor(deviceStatus), 
                        fontWeight: 700, fontSize: '0.85rem', transition: '0.3s' 
                    }}>
                        <div style={{ 
                            width: 8, height: 8, borderRadius: '50%', 
                            background: getStatusColor(deviceStatus), 
                            animation: deviceStatus === 'RECONNECTING' ? 'pulse 1s infinite' : 'none' 
                        }} />
                        {deviceStatus}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 24 }}>
                <SensorCard 
                    icon={Thermometer} title="Temperature" value={temperature} unit="°C" 
                    statusText={temperature > 35 ? 'High' : temperature < 10 ? 'Low' : 'Optimal'} 
                    statusColor={temperature > 35 ? '#ef4444' : temperature < 10 ? '#3b82f6' : '#10b981'}
                    highlightCondition={(v) => v > 40}
                    lastUpdated={timestamp}
                />
                <SensorCard 
                    icon={Wind} title="Air Humidity" value={humidity} unit="%" 
                    statusText={humidity > 80 ? 'High' : humidity < 30 ? 'Dry' : 'Optimal'} 
                    statusColor={humidity > 80 ? '#3b82f6' : humidity < 30 ? '#ef4444' : '#10b981'}
                    highlightCondition={(v) => v < 20}
                    lastUpdated={timestamp}
                />
                <SensorCard 
                    icon={Droplets} title="Soil Moisture" value={soilMoisture} unit="%" 
                    statusText={soilMoisture > 70 ? 'Wet' : soilMoisture < 30 ? 'Dry' : 'Optimal'} 
                    statusColor={soilMoisture > 70 ? '#3b82f6' : soilMoisture < 30 ? '#ef4444' : '#10b981'}
                    highlightCondition={(v) => v < 20}
                    lastUpdated={timestamp}
                />
                <SensorCard 
                    icon={Sun} title="Light Level" value={light} unit="lx" 
                    statusText={light > 800 ? 'Bright' : 'Dim'} 
                    statusColor={light > 800 ? '#f59e0b' : '#64748b'}
                    lastUpdated={timestamp}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 24 }}>
                <SensorCard 
                    icon={CloudRain} title="Rain Status" value={rain ? 'Raining' : 'Clear'} unit="" 
                    statusText={rain ? 'Active' : 'Clear'} 
                    statusColor={rain ? '#3b82f6' : '#10b981'}
                    lastUpdated={timestamp}
                />
                <SensorCard 
                    icon={Battery} title="Battery" value={battery} unit="%" 
                    statusText={battery < 20 ? 'Low' : 'Good'} 
                    statusColor={battery < 20 ? '#ef4444' : '#10b981'}
                    highlightCondition={(v) => v < 15}
                    lastUpdated={timestamp}
                />
                <SensorCard 
                    icon={Wifi} title="Signal Strength" value={signalStrength} unit="dBm" 
                    statusText={signalStrength < -80 ? 'Weak' : 'Good'} 
                    statusColor={signalStrength < -80 ? '#ef4444' : '#10b981'}
                    highlightCondition={(v) => v < -80}
                    lastUpdated={timestamp}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24, alignItems: 'start' }}>
                <LiveChart data={history} />
                
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
                                <span style={{ background: `${getStatusColor(deviceStatus)}20`, color: getStatusColor(deviceStatus), padding: '4px 12px', borderRadius: 12, fontWeight: 800, fontSize: '0.8rem' }}>{deviceStatus}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#aaa', fontWeight: 600 }}>Total Records</span>
                                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>{history.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Disease Risk Modal Overlay ── */}
            <AnimatePresence>
                {showRiskModal && riskResult && (
                    <DiseaseRiskModal 
                        result={riskResult} 
                        onClose={() => setShowRiskModal(false)} 
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DashboardPage;
