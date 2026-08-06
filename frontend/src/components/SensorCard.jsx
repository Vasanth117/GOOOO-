import React from 'react';
import { motion } from 'framer-motion';

const SensorCard = ({ icon: Icon, title, value, unit, statusText, statusColor, highlightCondition, lastUpdated }) => {
    const isHighlighted = highlightCondition ? highlightCondition(value) : false;
    
    return (
        <motion.div 
            whileHover={{ y: -5, boxShadow: `0 20px 40px ${statusColor}25` }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ 
                background: isHighlighted ? `${statusColor}10` : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                padding: '24px', 
                borderRadius: '24px', 
                border: `1px solid ${isHighlighted ? statusColor : '#e2e8f0'}`,
                position: 'relative', 
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}
        >
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'rotate(15deg)' }}>
                <Icon size={160} color={statusColor} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: `${statusColor}20`, color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} />
                </div>
                <div style={{ background: `${statusColor}20`, color: statusColor, padding: '4px 12px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem' }}>
                    {statusText || 'Normal'}
                </div>
            </div>
            
            <div style={{ marginTop: 24, position: 'relative', zIndex: 10 }}>
                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                    <motion.div 
                        key={value}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: -1 }}
                    >
                        {value !== null && value !== undefined ? (typeof value === 'number' ? value.toFixed(1) : value) : '--'}
                    </motion.div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#64748b' }}>{unit}</div>
                </div>
                <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}
                </div>
            </div>
        </motion.div>
    );
};

export default SensorCard;
