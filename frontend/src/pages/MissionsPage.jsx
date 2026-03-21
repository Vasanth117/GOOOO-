import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Leaf, Trophy, CheckCircle, Clock, PlayCircle,
    Rocket, Target, Zap, Globe, Flame, Loader2, ChevronRight, Brain,
    ShieldCheck, Award, MapPin, Camera, X, Send, ListChecks
} from "lucide-react";
import { apiService } from '../services/apiService';

const MissionsPage = () => {
    const [activeTab, setActiveTab] = useState('solo');
    const [missions, setMissions] = useState([]);
    const [communityMissions, setCommunityMissions] = useState([]);
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reward, setReward] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [missionData, statsData, communityData, reportData] = await Promise.all([
                    apiService.getMissions(),
                    apiService.getStats(),
                    apiService.getCommunityMissions(),
                    apiService.getMyPeriodicReports()
                ]);
                setMissions(missionData || []);
                setStats(statsData);
                setCommunityMissions(communityData || []);
                setReports(reportData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleComplete = (task) => {
        // Here we would normally submit proof, but for demo:
        setReward({ xp: task.xp_reward, badge: 'Task Completed!' });
        setTimeout(() => setReward(null), 3000);
    };

    if (loading) return <div className="loading-full"><Loader2 className="spinner" /></div>;

    const StatCard = ({ label, val, icon: Icon, color, trendIcon: Trend }) => (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-label">{label}</div>
                <Icon size={18} color={color} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="stat-val">{val}</div>
                {Trend && <Trend size={16} color={color} />}
            </div>
        </div>
    );

    return (
        <div className="leaderboard-page">
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Target size={24} color="#2d5a27" />
                    <h2 className="topbar-title" style={{ margin: 0 }}>Missions & Tasks</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 4 }}>
                    <span className="topbar-sub">Complete eco-challenges, earn XP & improve global sustainability</span>
                    <Globe size={14} color="#888" />
                </div>
            </div>

            <div className="stats-strip">
                <StatCard label="Streak" val="6 Days" icon={Flame} color="#d4af37" trendIcon={Zap} />
                <StatCard label="Total XP" val={stats?.xp || '0'} icon={Trophy} color="#2d5a27" />
                <StatCard label="Level" val={stats?.tier?.tier || 'Explorer'} icon={Award} color="#4c7c42" />
                <StatCard label="Sustainability Score" val={stats?.sustainability_score + " / 100"} icon={Leaf} color="#2d5a27" />
            </div>

            <div className="leaderboard-controls">
                <div className="scope-tabs">
                    {[
                        { id: 'solo', label: 'Solo Tasks', icon: Target },
                        { id: 'community', label: 'Community Marathons', icon: Globe },
                        { id: 'verification', label: '3rd-Day Reports', icon: CheckCircle },
                        { id: 'history', label: 'History', icon: Clock }
                    ].map(t => (
                        <button 
                            key={t.id}
                            className={`filter-tab ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <t.icon size={16} />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="tasks-grid" style={{ gridColumn: '1 / -1' }}>
                {activeTab === 'solo' && (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                            <h3 style={{ margin: 0, fontWeight: 950, color: '#1a1c19' }}>Daily & Weekly Challenges</h3>
                            <button 
                                className="create-post-btn" 
                                style={{ height: 44, background: '#f0f7f0', color: '#2d5a27', border: '1.5px solid #d1e2d1' }}
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await apiService.triggerAiMissions();
                                        const m = await apiService.getMissions();
                                        setMissions(m);
                                    } catch (err) { alert(err.message); }
                                    finally { setLoading(false); }
                                }}
                            >
                                <Brain size={18} /> Sync AI Missions
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                            {Object.values(missions).flat().map((task, i) => (
                                <MissionCard 
                                    key={task.progress_id} 
                                    task={task} 
                                    index={i} 
                                    onStart={async (id) => {
                                        try {
                                            await apiService.startMission(id);
                                            const m = await apiService.getMissions();
                                            setMissions(m);
                                            setReward({ xp: 10 });
                                            setTimeout(() => setReward(null), 3000);
                                        } catch (err) { alert(err.message); }
                                    }}
                                    onComplete={(task) => {
                                        setSelectedTask(task);
                                        setShowSubmitModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'community' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 25 }}>
                        {communityMissions.map((task, i) => (
                            <CommunityCard key={task.id} task={task} index={i} />
                        ))}
                    </div>
                )}

                {activeTab === 'verification' && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <VerificationSection 
                            reports={reports} 
                            onOpenModal={() => {
                                setSelectedTask({ id: 'periodic', title: 'Periodic Verification' });
                                setShowSubmitModal(true);
                            }} 
                        />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showSubmitModal && (
                    <MissionSubmissionModal 
                        task={selectedTask}
                        onClose={() => setShowSubmitModal(false)}
                        onSubmit={async (formData) => {
                            setSubmitting(true);
                            try {
                                if (selectedTask.id === 'periodic') {
                                    await apiService.submitPeriodicReport(formData);
                                    // Refresh reports
                                    const reportData = await apiService.getMyPeriodicReports();
                                    setReports(reportData);
                                } else {
                                    // Handle solo task submission
                                }
                                setShowSubmitModal(false);
                                setReward({ xp: 50, badge: 'Proof Verified' });
                                setTimeout(() => setReward(null), 3000);
                            } catch (err) {
                                alert(err.message);
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {reward && (
                    <motion.div 
                        className="reward-toast"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <Trophy size={24} color="#d4af37" />
                        <div>
                            <div style={{ fontWeight: 900, color: 'white' }}>MISSION STARTED</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Good luck with your journey!</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MissionCard = ({ task, index, onStart, onComplete }) => (
    <motion.div 
        className="task-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        style={{ background: 'white', padding: 25, borderRadius: 24, border: '1.5px solid #eeedeb', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
            <div style={{ background: '#f4f7f4', padding: '6px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, color: '#2d5a27', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                <Zap size={12} /> {task.mission_type}
            </div>
            <div className="xp-badge" style={{ background: '#fff9e6', color: '#d4af37', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={14} /> +{task.reward_points} XP
            </div>
        </div>
        
        <h4 style={{ fontSize: '1.1rem', fontWeight: 950, color: '#1a1c19', margin: '5px 0' }}>{task.title}</h4>
        <p style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{task.description}</p>
        
        <div style={{ background: '#f8faf8', padding: 12, borderRadius: 16, marginBottom: 20, border: '1px solid #f0f4f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#2d5a27' }}>
                <span>Status: <span style={{ textTransform: 'uppercase', color: task.status === 'active' ? '#d4af37' : '#2d5a27' }}>{task.status}</span></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> 24h</span>
            </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
            {task.status === 'active' ? (
                <button 
                    className="btn-start-task" 
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => onStart(task.progress_id)}
                >
                    <PlayCircle size={18} /> Start Challenge
                </button>
            ) : task.status === 'in_progress' ? (
                <button 
                    className="btn-complete-task" 
                    style={{ flex: 1, justifyContent: 'center', background: '#2d5a27', color: 'white', border: 'none' }}
                    onClick={() => onComplete(task)}
                >
                    <Camera size={18} /> Submit Evidence
                </button>
            ) : (
                <div style={{ flex: 1, height: 48, background: '#f0f7f0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d5a27', fontWeight: 900, gap: 8 }}>
                    <CheckCircle size={18} /> Completed
                </div>
            )}
        </div>
    </motion.div>
);

const CommunityCard = ({ task, index }) => {
    const progress = (task.current_value / task.target_value) * 100;
    return (
        <motion.div 
            className="task-card community-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{ layer: 1, background: 'linear-gradient(135deg, #1a3c1a 0%, #2d5a27 100%)', color: 'white', padding: 25, borderRadius: 24 }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, color: '#white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={12} /> Community Marathon
                </div>
                <div className="xp-badge" style={{ background: '#ffd700', color: '#1a3c1a', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 900 }}>
                   Pool: {task.reward_pool} XP
                </div>
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: '10px 0' }}>{task.title}</h4>
            <p style={{ fontSize: '0.9rem', color: '#eee', opacity: 0.9, lineHeight: 1.5 }}>{task.description}</p>
            
            <div style={{ marginTop: 25 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 10 }}>
                    <span>Global Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        style={{ height: '100%', background: '#ffde59', borderRadius: 6 }}
                    />
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: 8, color: '#ccc' }}>
                    {task.current_value.toLocaleString()} / {task.target_value.toLocaleString()} {task.unit}
                </div>
            </div>
        </motion.div>
    );
};

const VerificationSection = ({ reports, onOpenModal }) => (
    <div className="verification-area">
        <div style={{ background: 'white', padding: 30, borderRadius: 24, border: '1.5px solid #eeedeb', marginBottom: 25 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 950 }}>3rd-Day Organic Integrity Report</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 4 }}>Submit your 3rd-day verification to maintain your GOO Certification status.</p>
                </div>
                <button className="create-post-btn" style={{ height: '44px' }} onClick={onOpenModal}>
                    <Camera size={18} /> Submit Verification
                </button>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {reports.length > 0 ? reports.map((r, i) => (
                <div key={r.id || r._id || i} className="report-mini-card" style={{ background: '#fcfdfc', padding: 20, borderRadius: 20, border: '1px solid #e8eee8' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: r.abnormal_growth_flag ? '#fee2e2' : '#e7f5e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {r.abnormal_growth_flag ? <Flame size={20} color="#ef4444" /> : <ShieldCheck size={20} color="#2d5a27" />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{new Date(r.submission_date).toLocaleDateString()}</div>
                            <div style={{ fontSize: '0.75rem', color: r.abnormal_growth_flag ? '#ef4444' : '#2d5a27', fontWeight: 700 }}>
                                {r.abnormal_growth_flag ? 'Attention Required' : 'AI Verified Organic'}
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.4 }}>
                        {r.tasks_completed_summary?.substring(0, 100) || "No summary provided"}...
                    </div>
                </div>
            )) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#666' }}>
                    No verification reports submitted yet.
                </div>
            )}
        </div>
    </div>
);

const MissionSubmissionModal = ({ task, onClose, onSubmit }) => {
    const [summary, setSummary] = useState('');
    const [materials, setMaterials] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [gps, setGps] = useState(null);
    const [gettingGps, setGettingGps] = useState(false);

    useEffect(() => {
        setGettingGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGettingGps(false);
            },
            (err) => {
                console.error(err);
                setGettingGps(false);
            }
        );
    }, []);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = () => {
        if (!image || !gps) return alert("Proof and GPS are required!");
        const fd = new FormData();
        fd.append('file', image);
        fd.append('tasks_summary', summary);
        fd.append('organic_materials', materials);
        fd.append('latitude', gps.lat);
        fd.append('longitude', gps.lng);
        onSubmit(fd);
    };

    return (
        <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <motion.div 
                className="modal-content"
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: 32, padding: 35 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
                    <h2 style={{ margin: 0, fontWeight: 950 }}>{task.title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="input-field">
                        <label style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', gap: 6, marginBottom: 8 }}>
                            <ListChecks size={16} color="#2d5a27" /> Summary of Activities
                        </label>
                        <textarea 
                            placeholder="What tasks did you complete today?"
                            value={summary} onChange={e => setSummary(e.target.value)}
                            style={{ width: '100%', padding: 15, borderRadius: 12, border: '1.5px solid #eee', minHeight: 100 }}
                        />
                    </div>

                    <div className="input-field">
                        <label style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', gap: 6, marginBottom: 8 }}>
                            <Leaf size={16} color="#2d5a27" /> Organic Materials Used
                        </label>
                        <input 
                            placeholder="e.g. Vermicompost, Neem Oil"
                            value={materials} onChange={e => setMaterials(e.target.value)}
                            style={{ width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid #eee' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div 
                            className="gps-box" 
                            style={{ background: '#f8faf8', padding: 15, borderRadius: 16, border: '1.5px dashed #d1e2d1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <MapPin size={24} color={gps ? "#2d5a27" : "#aaa"} />
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: 4 }}>
                                {gettingGps ? 'Locating...' : (gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'GPS Required')}
                            </div>
                        </div>

                        <label 
                            className="camera-upload-box" 
                            style={{ background: '#f8faf8', padding: 15, borderRadius: 16, border: '1.5px dashed #2d5a27', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
                        >
                            {preview ? (
                                <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                            ) : (
                                <>
                                    <Camera size={24} color="#2d5a27" />
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: 4 }}>Live Capture</div>
                                </>
                            )}
                            <input type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
                        </label>
                    </div>

                    <button 
                        className="btn-start-task" 
                        style={{ width: '100%', justifyContent: 'center', height: 55, fontSize: '1rem' }}
                        disabled={gettingGps || !image}
                        onClick={handleSubmit}
                    >
                        Submit Evidence
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MissionsPage;
