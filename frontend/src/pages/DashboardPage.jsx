import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSensorData } from '../hooks/useSensorData';
import SensorCard from '../components/SensorCard';
import LiveChart from '../components/LiveChart';
import { 
    Thermometer, Droplets, Wind, Activity, Zap, ShieldCheck, Cpu, CloudRain, Sun, Battery, Wifi, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const sensorData = useSensorData();
    const navigate = useNavigate();
    const { 
        temperature, humidity, soilMoisture, soilPH, light, rain, 
        battery, signalStrength, timestamp, deviceStatus, history 
    } = sensorData;

    const getStatusColor = (status) => {
        switch (status) {
            case 'ONLINE': return '#10b981';
            case 'RECONNECTING': return '#f59e0b';
            case 'OFFLINE': return '#ef4444';
            case 'NO_DATA': return '#9ca3af';
            default: return '#9ca3af';
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
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
        </motion.div>
    );
};

export default DashboardPage;
