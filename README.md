# 🌱 GOO — AI-Driven Gamified Sustainable Farming Ecosystem
> **Last Updated:** August 2026  
> **Version:** 1.0.0 (Full Stack Implementation + Multi-Agent AI)  
> **Status:** 🟢 Live / Production-Ready

---

## 📌 WHAT IS GOO?

GOO is an **end-to-end, AI-driven, gamified agritech ecosystem**. It transforms traditional farming into a data-driven, socially engaging, and highly accessible practice. By merging **Social Media Gamification**, **Computer Vision (YOLOv8)**, **IoT Hardware (ESP32)**, **Telephony AI (Voice4Farmers)**, and a **Direct-to-Consumer Marketplace**, GOO bridges the gap between high-tech agricultural science, low-tech farming realities, and fair-trade economics.

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

## 🏗️ THE FIVE PILLARS OF GOO

1. **The Gamified Social Network:** Farm profiles, social feeds, and a Gamification Engine (XP, Coins, Badges, Streaks) to enforce eco-habits.
2. **The AI Agronomist:** YOLOv8 plant disease detection and an LLM chatbot (`AIPage`) acting as a personal agronomist for crop rotation, fertilizer schedules, and yield predictions.
3. **Voice4Farmers (Telephony AI):** A Twilio-powered toll-free AI hotline using RAG, converting speech to text, and providing localized agricultural advice (Tamil, Hindi, English) for offline farmers.
4. **Smart Farm IoT:** ESP32 Soil Nodes for real-time telemetry (NPK, moisture, temp) to automate irrigation and monitor farm health.
5. **Direct-to-Consumer Marketplace:** Sell AI-Verified produce, use gamified "Coins" to boost listings, and maintain a transparent supply chain for buyers.

---

## ⚙️ TECH STACK

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Vite, TailwindCSS (Responsive Web App) |
| **Backend Core** | Python 3.11+, FastAPI, Uvicorn |
| **Database Layer** | MongoDB (Beanie ODM) for App Data, ChromaDB/FAISS (RAG) |
| **AI & ML (Vision)**| Ultralytics YOLOv8 (Plant disease diagnostics), LLaMA 3.2 Vision |
| **AI & ML (NLP)** | Groq API (LLaMA 3), LangChain |
| **Telephony / Audio**| Twilio Voice API, Deep Translator, gTTS |
| **Authentication** | JWT (python-jose) + bcrypt |
| **IoT / Hardware** | ESP32 Microcontrollers, Capacitive Soil Moisture Sensors, C++ |

---

## 🚀 HOW TO RUN LOCALLY

### Prerequisites
- Python 3.11+
- Node.js (v18+)
- MongoDB running locally on port 27017

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
python run.py
```
*API runs on `http://localhost:8001/api/v1`* | *Swagger UI: `http://localhost:8001/docs`*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Web app runs on `http://localhost:5173`*

---

## 🗺️ FEATURE ROADMAP & COMPLETION STATUS

### ✅ Phase 1: Backend Foundation (DONE)
- Auth system, Farm Digital ID, Score Engine, Streak & Badge System.
- 22+ MongoDB Collections & 4 Cron jobs (APScheduler).
- JWT Middleware and Haversine GPS validation.

### ✅ Phase 2: Mission System (DONE)
- Auto-assignment of daily eco-missions.
- Proof upload with Multipart files + GPS validation.
- Gamified cascade: Score, Streak, Badge, and Notification triggers.

### ✅ Phase 3: Social & Leaderboard (DONE)
- Community feed, Follow relationships, Likes & Comments.
- Public farmer profiles and National/Streak leaderboards.
- GRC (Green Revolution Club) verification routes.

### ✅ Phase 4: AI Intelligence & Vision (DONE)
- AI Chatbot via Groq (LLaMA 3).
- Real-time weather intelligence via OpenWeather.
- YOLOv8-powered Computer Vision for disease detection and proof auto-verification.

### ✅ Phase 5: Marketplace & Rewards (DONE)
- Direct-to-Consumer B2B/B2C marketplace.
- Point-to-Cash redemption logic (Eco-coins for boosts and discounts).
- "AI-Certified Healthy" labels based on IoT + Vision data.

### ✅ Phase 6: Admin Platform (DONE)
- Full User & Role management.
- Safety controls (Ban/Unban) and Fraud flag management.
- Real-time platform analytics dashboard.

### ✅ Phase 7: Frontend Web App (DONE)
- High-speed Vite + React architecture.
- Full UI suite: Dashboard, AI Chat, Missions, Community, Marketplace, Leaderboard, Camera UI, Rewards, and Settings.
- Professional enterprise-grade interface (Lucide-react icons, Tailwind).

### ✅ Phase 8: Multi-Agent AI & Voice4Farmers (DONE)
- Multi-Agent ecosystem: Gamification Agent, Vision Gatekeeper, Opportunity Intelligence.
- Voice4Farmers RAG Architecture: Twilio IVR integration allowing offline farmers to call for localized AI support.
- Automated IoT (ESP32) webhooks triggering notifications and smart actions.

---

## 🎮 GAMIFICATION LOGIC

**Score Engine:**
- **Gains:** Mission Complete (+10), Streak Bonus (+20), Community Verified (+25), Expert Approved (+30), Water Saving (+10).
- **Losses:** Chemical Pesticide Use (-20), Inactivity (-10 to -50), Fraud Penalty (-50).

**Tiers:** 🌱 Beginner (0-500) ➜ 🌾 Intermediate (501-1500) ➜ 🌍 Advanced (1501-3000) ➜ ⭐ Expert (3001+)

---

> 💡 **Note:** This README serves as the master overview of the entire GOO AI Platform ecosystem.
