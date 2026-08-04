# GOO Platform System Architecture

This document outlines the complete system architecture of the GOO AI-driven gamified social media farming platform, based strictly on the visual architectural blueprint provided.

## 1. User Interface Layer
**User Device (Web Browser):** The primary entry point for farmers and users, accessible via mobile or desktop web browsers.

**Frontend (React + Vite):**
The client-side application built for high performance and responsiveness.
*   **Authentication:** Login and Signup flows.
*   **Farmer Dashboard:** Central hub for the farmer's critical data.
*   **AI Smart Advisor Chat:** Real-time conversational interface with the AI agronomist.
*   **Sustainable Farming Missions:** Interface for engaging with gamified tasks.
*   **Social Feed:** Community posts, updates, and knowledge sharing.
*   **Sustainability Score Dashboard:** Visual tracking of environmental impact.
*   **Leaderboard:** Gamified rankings of top sustainable farmers.
*   **Marketplace:** UI for buying and selling eco-friendly products and produce.
*   **Weather Insights:** Real-time weather and satellite data visualizations.
*   **Profile & Farm Details:** Management of personal and farm-specific data.

## 2. API Layer
The central routing gateway that handles incoming REST requests from the frontend and directs them to the appropriate backend services.
*   `/api/auth`
*   `/api/farmers`
*   `/api/farm-data`
*   `/api/missions`
*   `/api/community`
*   `/api/leaderboard`
*   `/api/weather`
*   `/api/marketplace`
*   `/api/rewards`
*   `/api/ai-advisor`
*   `/api/sustainability-score`

## 3. Core Services Layer
The foundational business logic of the platform.

**Authentication Service:**
*   Farmer login/signup logic
*   JWT authentication generation & validation
*   Password encryption
*   User roles management

**Farm Profile Service:**
*   Crop type management
*   Soil type tracking
*   Farm size and Location mapping
*   Farming methods documentation

## 4. Feature & Micro-Services Layer
The specialized business services that power the interactive and gamified elements of the platform.

**Gamification Service:**
*   Sustainability missions tracking
*   Farmer streaks and engagement
*   Points system calculation
*   Badges distribution
*   Leaderboards management

**Sustainability Score Engine:**
*   Water usage analysis
*   Soil health monitoring
*   Chemical usage tracking
*   Crop diversity evaluation
*   Energy consumption metrics

**Community Service:**
*   Posting farming activities
*   Comments and likes interactions
*   Following other farmers
*   Knowledge sharing infrastructure

**Marketplace Service:**
*   Sustainable farming products directory
*   Organic fertilizer listings
*   Eco-friendly equipment sales
*   Farmer produce selling mechanics

**Reward Engine:**
*   Completing missions validation
*   Improving sustainability score rewards
*   Participating in challenges
*   Points ledger management
*   Discount vouchers generation
*   Marketplace credits system

## 5. AI Engine Layer
The intelligent core providing actionable insights and automated analysis.

**AI Sustainability Analyzer:**
*   Analyzes farmer behavior based on input and ecosystem data to feed into the Sustainability Score Engine.

**AI Smart Farming Advisor:**
*   Provides contextual, AI-driven advice to farmers on best practices, sustainable products, and optimal resource usage.

**Weather & Satellite Insights Engine:**
*   Integration with external Weather APIs for local forecasting.
*   Satellite crop monitoring for macro-level farm health analysis.

## 6. Data Layer (Database)
**MongoDB** (NoSQL Document Store):
The central repository for all platform data, ensuring scalable and flexible data structures.

**Key Collections:**
*   `Users`
*   `FarmProfiles`
*   `Activities`
*   `Missions`
*   `MissionProgress`
*   `Posts`
*   `Comments`
*   `Rewards`
*   `Products`
*   `Orders`
*   `WeatherData`
*   `AIRecommendations`
*   `SustainabilityScores`
*   `Leaderboards`

---

## Complete System Flow Diagram

```mermaid
graph TD
    %% User Layer
    User((User Device)) -->|Web Browser| Frontend

    %% Frontend Layer
    subgraph Frontend_React_Vite [Frontend - React + Vite]
        UI1[Auth & Dashboard]
        UI2[AI Chat & Missions]
        UI3[Social Feed & Leaderboard]
        UI4[Marketplace & Weather]
    end

    Frontend_React_Vite --> APILayer

    %% API Layer
    subgraph APILayer [API Layer]
        direction LR
        API_Auth[/api/auth, /api/farmers, ...]
        API_Core[/api/farm-data, /api/community, ...]
        API_Gamify[/api/missions, /api/rewards, ...]
        API_AI[/api/ai-advisor, /api/sustainability-score]
    end

    APILayer --> CoreServices
    APILayer --> FeatureServices
    APILayer --> AILayer

    %% Core Services
    subgraph CoreServices [Core Services Layer]
        Auth[Authentication Service]
        FarmProfile[Farm Profile Service]
    end

    %% Feature Services
    subgraph FeatureServices [Feature Engines & Services]
        Gamification[Gamification Service]
        SustainScore[Sustainability Score Engine]
        Community[Community Service]
        Marketplace[Marketplace Service]
        Rewards[Reward Engine]
    end

    %% AI Layer
    subgraph AILayer [AI Engine Layer]
        AIAnalyzer[AI Sustainability Analyzer]
        AIAdvisor[AI Smart Farming Advisor]
        WeatherSat[Weather & Satellite Engine]
    end

    CoreServices --> DB
    FeatureServices --> DB
    AILayer --> DB
    AIAnalyzer --> DB

    %% Database Layer
    subgraph DB [Data Layer - MongoDB]
        Collections[(Users, FarmProfiles, Posts, Products...)]
    end
```
