# 🌱 GOO — AI-Driven Gamified Sustainable Farming Ecosystem
> **Last Updated:** August 2026  
> **Version:** 1.0.0 (Full Stack Implementation + Multi-Agent AI)  
> **Status:** 🟢 Live / Production-Ready

---

## 📌 WHAT IS GOO?

GOO is an **end-to-end, AI-driven, gamified agritech ecosystem**. It transforms traditional farming into a data-driven, socially engaging, and highly accessible practice. By merging **Social Media Gamification**, **Computer Vision (YOLOv8)**, **IoT Hardware (ESP32)**, **Telephony AI (Voice4Farmers)**, and a **Direct-to-Consumer Marketplace**, GOO bridges the gap between high-tech agricultural science, low-tech farming realities, and fair-trade economics.

- Tracks farmer activities continuously
- Guides farmers using AI recommendations
- Verifies real-world farming behavior via proof uploads (YOLOv8 & LLaMA 3.2 Vision)
- Uses gamification (missions, streaks, badges, leaderboards) to enforce eco-habits
- Builds a social + economic ecosystem for farmers (Direct-to-Consumer Marketplace)
- Provides an AI hotline via Voice4Farmers for offline accessibility

> **Goal:** Convert farming into measurable, competitive, sustainable, and profitable behavior while ensuring farmers get paid fairly.

---

## 🧑‍🤝‍🧑 USER ROLES

| Role | Description |
|---|---|
| 👨‍🌾 **Farmer** | Primary user — completes missions, tracks crops, earns rewards |
| 👨‍🔬 **Expert / Verifier** | Reviews farms, confirms sustainability and eco-practices |
| 🛒 **Seller / Buyer** | Trades eco-certified products in the direct-to-consumer marketplace |
| 🛠 **Admin** | Controls platform, manages users, detects fraud via dashboard |
| 🌍 **GRC (Green Revolution Club)** | Elite verified farmers, community validators |

---

## 🗂️ PROJECT STRUCTURE

```text
E:\GOO\
├── README.md                        ← YOU ARE HERE (living project log)
├── GOO_Master_Project_Architecture.md ← Detailed ecosystem architecture
├── frontend\                        ← Vite + React Frontend
│   ├── public\                      ← Static assets (Logos/Images)
│   ├── src\                         ← React Source Code
│   │   ├── assets\                  ← Imported assets
│   │   ├── components\              ← Reusable UI components
│   │   ├── pages\                   ← Page-level components (Dashboard, Marketplace, AIPage, etc.)
│   │   └── services\                ← API service layers
│   ├── package.json                 ← Node dependencies
│   └── vite.config.js               ← Vite/Proxy configuration
└── backend\                         ← Python FastAPI Backend
    ├── .env                         ← Environment variables (local, not committed)
    ├── .env.example                 ← Env variable template
    ├── requirements.txt             ← Python dependencies
    ├── run.py                       ← Server entry point
    └── app\                         ← Backend logic
        ├── main.py                  ← FastAPI app, CORS, lifespan, routers
        ├── config.py                ← Pydantic settings from .env
        ├── database.py              ← MongoDB + Beanie ODM initialization
        │
        ├── models\                  ← MongoDB Document models (Beanie ODM)
        │   ├── user.py, farm_profile.py, mission.py, proof_submission.py
        │   ├── score.py, streak.py, badge.py, reward.py, notification.py
        │   └── post.py, product.py, order.py, leaderboard.py, fraud_flag.py, etc. (22+ models)
        │
        ├── schemas\                 ← Pydantic request/response models
        │
        ├── controllers\             ← Business logic layer
        │   └── auth_controller.py, farm_controller.py, admin_controller.py, etc.
        │
        ├── routes\                  ← FastAPI route definitions
        │   └── auth_routes.py, farm_routes.py, score_routes.py, ai_routes.py, marketplace_routes.py, etc.
        │
        ├── services\                ← Reusable business services
        │   ├── ai_service.py        ← YOLOv8, LLaMA Vision, RAG integration
        │   ├── score_service.py, streak_service.py, badge_service.py, etc.
        │
        ├── utils\                   ← Utility helpers
        │
        ├── middleware\              ← JWT guard + role-based access control
        │
        └── jobs\                    ← Background cron jobs (APScheduler)
            └── scheduler.py, score_decay_job.py, mission_job.py, leaderboard_job.py
```

---

## ⚙️ TECH STACK

| Layer | Technology |
|---|---|
| **Language** | Python 3.11+, JavaScript (ES6) |
| **Frontend** | React.js, Vite, TailwindCSS (Responsive Web App) |
| **Backend Core** | FastAPI 0.110, Uvicorn (ASGI) |
| **Database Layer** | MongoDB (Beanie ODM) for App Data, ChromaDB/FAISS (RAG) |
| **AI & ML (Vision)**| Ultralytics YOLOv8 (Plant disease diagnostics), LLaMA 3.2 Vision |
| **AI & ML (NLP)** | Groq API (LLaMA 3), LangChain |
| **Telephony / Audio**| Twilio Voice API, Deep Translator, gTTS |
| **Authentication** | JWT (python-jose) + bcrypt (passlib) |
| **IoT / Hardware** | ESP32 Microcontrollers, Capacitive Soil Moisture Sensors, C++ |
| **Scheduler & Validation** | APScheduler, Pydantic v2 |

---

## 🔌 API ENDPOINTS

Base URL: `http://localhost:8001/api/v1`  
Interactive Docs: `http://localhost:8001/docs`

### 🔐 AUTH — `/api/v1/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Register new user |
| `POST` | `/login` | ❌ | Login, get tokens |
| `POST` | `/refresh-token` | ❌ | Refresh access token |
| `POST` | `/logout` | ❌ | Revoke refresh token |
| `GET` | `/me` | ✅ | Get current user info |

### 🌾 FARM — `/api/v1/farm`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/create` | ✅ Farmer | Create farm profile |
| `GET` | `/me` | ✅ Farmer | View my farm |
| `GET` | `/:farmId` | ✅ Expert/Admin | View any farm |
| `PUT` | `/update` | ✅ Farmer | Update farm details |
| `POST` | `/checkin` | ✅ Farmer | Submit weekly check-in |

### 📊 SCORE — `/api/v1/score`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/me` | ✅ Farmer | Get current score + tier |
| `GET` | `/history` | ✅ Farmer | Score history (for graph) |
| `GET` | `/streak` | ✅ Farmer | Get streak info |
| `GET` | `/badges` | ✅ Farmer | Get earned + locked badges |

*(Note: Additional comprehensive endpoints exist for `/ai`, `/marketplace`, `/social`, `/admin`, `/missions`, `/leaderboard`, etc.)*

---

## 📋 BUILD PHASES & ROADMAP

### ✅ Phase 1 — Backend Foundation (DONE)
- [x] Auth system (register, login, refresh, logout)
- [x] Farm Digital ID (create, update, view, weekly check-in)
- [x] Sustainability Score Engine (rules, decay, history logs)
- [x] Streak system (milestones, reset, bonus)
- [x] Badge system (auto-check, award, seeder)
- [x] Notification system
- [x] All 22+ MongoDB models
- [x] 4 Cron jobs (scheduler)
- [x] JWT auth middleware + role guards
- [x] GPS validation utility (Haversine)

### ✅ Phase 2 — Mission System (DONE)
- [x] Mission templates seeder (16 default missions)
- [x] Assign missions to farmers (Auto-assignment)
- [x] Start mission & Submit proof (Multipart file upload + GPS validation)
- [x] Expert reviews flagged proof (Approve/Reject)
- [x] Mission history & completion stats
- [x] Mission completion cascade (Score + Streak + Badge + Notification)

### ✅ Phase 3 — Social + Leaderboard (DONE)
- [x] Social feed (Followers/Following logic)
- [x] Post creation, deletion, and auto-posts for missions
- [x] Like/Unlike and Commenting system
- [x] Public Farmer Profiles with all stats
- [x] Leaderboard routes (National, Streak, Mission Champions)
- [x] GRC verification routes (Review farms) & member management

### ✅ Phase 4 — AI Intelligence (DONE)
- [x] Gemini / Groq Farming Advisor (Contextual chat)
- [x] Crop Recommendation AI (Geo + Weather based)
- [x] Weather Intelligence (OpenWeather integration)
- [x] AI Proof Auto-verification (LLaMA 3.2 Vision)
- [x] AI-enhanced weather risk scanning

### ✅ Phase 5 — Marketplace + Rewards (DONE)
- [x] Product listings (CRUD for Sellers/Admins)
- [x] Marketplace browsing with price/category filters
- [x] Order placement system
- [x] Points redemption logic (100 pts = $1 discount)
- [x] Reward wallet (View points + active vouchers)
- [x] Voucher redemption system
- [x] GOO Verified product labeling support

### ✅ Phase 6 — Admin Panel (DONE)
- [x] User management (List all users, Search by role)
- [x] Role management (Update user roles)
- [x] Safety controls (Ban/Unban users)
- [x] Fraud flag management (Review and Resolve behavior anomalies)
- [x] Platform analytics (Real-time dashboard stats)

### ✅ Phase 7 — Frontend Web App (DONE)
- [x] Framework: Vite + React (Legacy-free, high speed)
- [x] Premium Landing Page (Eco-luxury design)
- [x] Authentication UI (Login/Register)
- [x] Farmer Dashboard UI & Mission Hub UI
- [x] Social Feed, Community Page & Leaderboard UI
- [x] Professional enterprise-grade interface (Lucide-react icons, Tailwind)
- [x] Camera Page, Field Map, Profile Page, Rewards, Settings

### ✅ Phase 8 — Multi-Agent AI & Voice4Farmers (DONE)
- [x] Multi-Agent ecosystem: Gamification Agent, Vision Gatekeeper, Opportunity Intelligence.
- [x] Voice4Farmers RAG Architecture: Twilio IVR integration allowing offline farmers to call for localized AI support.
- [x] Automated IoT (ESP32) webhooks triggering notifications and smart actions.
- [x] Computer Vision Gatekeeper via YOLOv8 model for plant disease diagnostics.

---

## 🎮 GAMIFICATION LOGIC

### Score Rules
```text
GAINS:
  Mission Complete        → +10 pts
  Streak Bonus (7/30/100) → +20 pts
  Community Verified      → +25 pts
  Expert Approved         → +30 pts
  Water Saving            → +10 pts
  Organic Fertilizer      → +15 pts
  Weekly Check-in         → +5 pts

LOSSES:
  Chemical Pesticide Use  → -20 pts
  Inactivity (7 days)     → -10 pts
  Inactivity (14 days)    → -25 pts
  Inactivity (30 days)    → -50 pts
  Fraud Penalty           → -50 pts
  Proof Rejected          → -15 pts

LIMITS: min=0, max=10,000
```

### Score Tiers
```text
🌱 Beginner      → 0   – 500
🌾 Intermediate  → 501 – 1500
🌍 Advanced      → 1501 – 3000
⭐ Expert        → 3001+
```

### Default Badges
| Badge | Condition |
|---|---|
| 🌱 Beginner Farmer | Score ≥ 100 |
| 🌾 Growing Farmer | Score ≥ 501 |
| 🌍 Eco Champion | Score ≥ 1501 |
| ⭐ Farming Expert | Score ≥ 3001 |
| 🔥 7-Day Streak | Streak ≥ 7 days |
| 🌟 30-Day Legend | Streak ≥ 30 days |
| 🏆 100-Day Master | Streak ≥ 100 days |
| 🎯 Mission Starter | 10 missions done |
| 💪 Mission Pro | 50 missions done |

---

## ⏰ CRON JOBS (Background Tasks)

| Job | Schedule | What It Does |
|---|---|---|
| Daily Mission Generation | Every midnight | Assigns fresh daily missions to all farmers |
| Mission Expiry Check | Every hour | Marks expired missions, resets broken streaks |
| Score Decay | Every night 2am | Applies inactivity penalty to inactive farmers |
| Leaderboard Refresh | Every 6 hours | Rebuilds and caches top-100 national leaderboard |

---

## 🗄️ DATABASE COLLECTIONS (MongoDB)

| Collection | Purpose |
|---|---|
| `users` | All user accounts |
| `farm_profiles` | Farm Digital ID data |
| `missions` | Mission templates |
| `mission_progress` | Per-farmer mission tracking |
| `proof_submissions` | Upload records + AI results |
| `score_logs` | Full score change audit trail |
| `streaks` | Daily streak tracking |
| `badge_definitions` | Badge condition templates |
| `farmer_badges` | Badges earned by farmers |
| `rewards` | Points wallet + vouchers |
| `notifications` | In-app notifications |
| `posts` | Social feed posts |
| `comments` | Comments on posts |
| `reactions` | Likes on posts |
| `follows` | Follow relationships |
| `products` | Marketplace listings |
| `orders` | Purchase records |
| `leaderboards` | Cached leaderboard entries |
| `fraud_flags` | Behavior anomaly records |
| `verifications` | GRC/Expert review records |
| `grc_members` | Green Revolution Club members |
| `refresh_tokens` | JWT refresh token storage |

---

## 🚀 HOW TO RUN

### Prerequisites
- Python 3.11+
- Node.js (v18+)
- MongoDB running locally on port 27017

### Steps
```bash
# --- BACKEND ---
# 1. Navigate and Install
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# 2. Run the server
python run.py

# --- FRONTEND ---
# 1. Navigate and Install
cd frontend
npm install

# 2. Run the dev server
npm run dev
```

### Server URLs
| URL | Description |
|---|---|
| `http://localhost:8001` | API root / health check |
| `http://localhost:8001/docs` | Swagger UI (interactive API docs) |
| `http://localhost:5173` | Frontend React App |

---

## 📝 CHANGE LOG

### 2026-08-01 — Update: Full Stack & AI Integration Complete
- ✅ **Phase 7 & 8 Implemented:**
  - Completed React + Vite Frontend application with full dashboard, AI chat, missions, marketplace, and social feed functionality.
  - Standardized UI with Lucide-react components for a highly professional interface.
  - Deployed Multi-Agent architecture (Gamification Agent, Vision Gatekeeper).
  - Integrated YOLOv8 for accurate plant disease detection.
  - Implemented Voice4Farmers RAG architecture with Twilio IVR.
- ✅ **Infrastructure:**
  - Full CI/CD integration potential established. Database schemas fully stabilized.

### 2026-03-17 — Update: Admin Panel Logic
- ✅ **Phase 6 Implementation:**
  - Created `admin_controller.py`, `admin_routes.py`, `admin_schema.py`.
  - Implemented user management (role updates, banning).
  - Implemented fraud flag resolution.
  - Added platform-wide analytics/stats engine.

### 2026-03-17 — Update: Marketplace & Rewards
- ✅ **Phase 5 Implementation:**
  - Created marketplace & reward controllers, routes, schemas.
  - Implemented product CRUD, ordering, and point-to-cash redemption logic.
  - Added reward wallet and voucher management.

### 2026-03-17 — Initial Build
- ✅ Project structure created under `E:\GOO\`
- ✅ Tech stack decided: Python + FastAPI + MongoDB
- ✅ Auth, Farm, Score, Gamification rules built
- ✅ 4 background cron jobs via APScheduler
- ✅ GPS Haversine utility for proof validation

---

## 🔮 FUTURE FEATURES (Ideas — Not Planned Yet)

- 📱 Mobile app (React Native / Flutter)
- 🌐 Multi-language UI support (Tamil, Hindi, Telugu)
- 🛰 Satellite farm monitoring integration
- 🧾 Government subsidy tracking
- 🏦 Direct bank transfer for marketplace earnings
- 📡 Offline mode with local sync
- 🤝 NGO / Government partnership portal

---

> 💡 **Note:** This README is the single source of truth for the GOO project.  
> It is continually updated as the platform evolves.
