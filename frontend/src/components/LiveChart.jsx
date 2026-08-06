import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LiveChart = ({ data }) => {
    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #eeedeb', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', width: '100%' }}>
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
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />
                        <Area type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumid)" isAnimationActive={false} />
                        <Area type="monotone" dataKey="soilMoisture" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMoist)" isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LiveChart;
