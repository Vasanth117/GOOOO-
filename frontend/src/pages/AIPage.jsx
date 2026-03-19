import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Mic, Send, Camera, Thermometer, Droplets, 
    Wind, CloudRain, ShieldCheck, Zap, AlertTriangle, 
    ChevronRight, Sparkles, Sprout, Brain, BarChart, 
    Image as ImageIcon, Upload, Info, CheckCircle2,
    Activity, Microscope, Search
} from 'lucide-react';

// ─────────────────────────────────────────
// MOCK DATA & COMPONENTS
// ─────────────────────────────────────────
const QUICK_ACTIONS = [
    { label: "Check Soil Health", icon: Sprout },
    { label: "Irrigation Advice", icon: Droplets },
    { label: "Pest Control", icon: ShieldCheck },
    { label: "Crop Suggestion", icon: Brain }
];

const AIPage = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Namaste! I am GOO AI. How can I help your farm grow sustainably today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulated AI response logic
        setTimeout(() => {
            const aiMsg = { role: 'ai', text: `Based on your soil and current humidity (42%), I recommend reducing irrigation today. Rain is expected in 6 hours.` };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const toggleVoice = () => {
        setIsListening(!isListening);
        if(!isListening) {
            // Simulated voice stop
            setTimeout(() => {
                setIsListening(false);
                setInput("What is the best crop for this season?");
            }, 3000);
        }
    };

    return (
        <div className="ai-page-layout">
            
            {/* ── LEFT: CHAT INTERFACE ── */}
            <div className="chat-container">
                <header className="chat-header">
                    <div className="ai-status">
                        <div className="pulse-circle" />
                        <div>
                            <div className="status-title">GOO AI Assistant</div>
                            <div className="status-sub">Intelligent & Online</div>
                        </div>
                    </div>
                </header>

                <div className="chat-messages">
                    <AnimatePresence>
                        {messages.map((m, i) => (
                            <motion.div 
                                key={i} 
                                className={`chat-bubble ${m.role}`}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                            >
                                <div className="bubble-body">{m.text}</div>
                            </motion.div>
                        ))}
                        {isTyping && (
                            <motion.div className="chat-bubble ai typing">
                                <span className="dot" /><span className="dot" /><span className="dot" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                </div>

                <div className="chat-input-area">
                    <div className="quick-action-row">
                        {QUICK_ACTIONS.map((action, i) => (
                            <motion.button 
                                key={i} className="action-pill"
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setInput(action.label)}
                            >
                                <action.icon size={14} /> {action.label}
                            </motion.button>
                        ))}
                    </div>

                    <form className="input-form" onSubmit={handleSend}>
                        <motion.button 
                            type="button" 
                            className={`mic-btn ${isListening ? 'active' : ''}`}
                            onClick={toggleVoice}
                            animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <Mic size={20} />
                        </motion.button>
                        
                        <input 
                            type="text" 
                            placeholder={isListening ? "Listening..." : "Ask your AI Advisor..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />

                        <button type="submit" className="send-btn">
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* ── RIGHT: INTELLIGENCE PANEL ── */}
            <aside className="ai-stats-panel">
                
                {/* Image Analysis Zone */}
                <motion.div className="ai-widget-card" whileHover={{ y: -5 }}>
                    <div className="widget-header">
                        <div className="icon-wrap gold"><Camera size={18} /></div>
                        <div className="widget-title">Crop Image Analysis</div>
                    </div>
                    <div className="upload-zone" onClick={() => setShowImageUpload(true)}>
                        <Upload size={32} color="#aaa" />
                        <div className="upload-text">Upload crop photo to detect diseases</div>
                    </div>
                    {showImageUpload && (
                        <div className="analysis-result-mini">
                            <CheckCircle2 size={14} color="#2d5a27" />
                            <span>Scan Complete: Healthy Crop</span>
                        </div>
                    )}
                </motion.div>

                {/* Weather Intelligence */}
                <motion.div className="ai-widget-card" whileHover={{ y: -5 }}>
                    <div className="widget-header">
                        <div className="icon-wrap blue"><CloudRain size={18} /></div>
                        <div className="widget-title">Weather Intelligence</div>
                    </div>
                    <div className="weather-stats">
                        <div className="w-stat">
                            <span className="w-label">Rain Chance</span>
                            <span className="w-val">75%</span>
                        </div>
                        <div className="w-stat">
                            <span className="w-label">Suggested Action</span>
                            <span className="w-val warning">Skip Irrigation</span>
                        </div>
                    </div>
                </motion.div>

                {/* Soil Health Pulse */}
                <motion.div className="ai-widget-card" whileHover={{ y: -5 }}>
                    <div className="widget-header">
                        <div className="icon-wrap green"><Sprout size={18} /></div>
                        <div className="widget-title">Soil Health Pulse</div>
                    </div>
                    <div className="soil-bars">
                        {['Nitrogen', 'Phosphorus', 'Potassium'].map((nutri, i) => (
                            <div key={nutri} className="soil-item">
                                <div className="soil-label"><span>{nutri}</span> <span>{80 - (i*15)}%</span></div>
                                <div className="soil-bar-bg"><div className="soil-bar-fill" style={{ width: `${80 - (i*15)}%` }} /></div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* AI Alerts */}
                <motion.div className="ai-widget-card alert-card">
                    <div className="widget-header">
                        <div className="icon-wrap red"><AlertTriangle size={18} /></div>
                        <div className="widget-title" style={{ color: '#e63946' }}>Smart Alerts</div>
                    </div>
                    <div className="ai-alert-item">
                        <div className="alert-dot" />
                        High Heat Wave predicted for Warangal district next 48h.
                    </div>
                </motion.div>

                {/* Insights Section */}
                <motion.div className="ai-widget-card">
                    <div className="widget-header">
                        <div className="icon-wrap purple"><BarChart size={18} /></div>
                        <div className="widget-title">AI Farm Insights</div>
                    </div>
                    <div className="insight-item">
                        <Zap size={14} color="#d4af37" />
                        Your sustainability score improved by 4% this week.
                    </div>
                    <div className="insight-item">
                        <ShieldCheck size={14} color="#2d5a27" />
                        Bio-fertilizer adoption is working well for your crop.
                    </div>
                </motion.div>

            </aside>

        </div>
    );
};

export default AIPage;
