# 🇩🇪 Deutsch Hub - The Complete Feature Guide

Deutsch Hub is a premium, AI-powered German language learning platform built with React, Vite, Tailwind CSS, and Firebase. It integrates advanced Spaced Repetition Systems (SRS), dynamic gamification, and intelligent flashcard generation powered by Groq's insanely fast LLMs.

This document serves as the master feature guide, explaining exactly what the platform does, where features are located, and how they function under the hood.

---

## 🔐 1. Authentication & Cloud Sync
**Location:** **Login Page / Settings**
*   **Google OAuth:** Secure user authentication powered by Firebase Auth. It enables a one-click login experience.
*   **Demo Mode:** Immediate, frictionless access for users who want to review the UI and tools without permanently registering.
*   **Firestore Real-time Sync:** All core state—including XPS, streaks, daily goals, custom flashcards, and deck configurations—is seamlessly synced across sessions in real-time. Whether a user studies on their phone or desktop, the state never drops.

---

## 🌐 2. The Global Library & Deck Sharing
Deutsch Hub features a robust ecosystem for creating and securely distributing decks among the community.

### 🎨 Community Explore Tab (Public Decks)
**Location: The "Explore" Tab on Dashboard**
*   **Publishing a Deck:** Inside any deck, users can click **"🌍 Publish"**. This securely strips their private SRS metrics (like confidence stats or failure counts) and uploads a clean version of the deck to the global `publicDecks` Firestore collection. 
*   **Community Imports:** Any user browsing the Explore tab can browse through categorized public decks and hit **"📥 Import"**. This securely creates an independent instance of the flashcards in their own library, ensuring their study metrics never interfere with the original author's.

### 🔗 Private Code Sharing
**Location: Inside Deck Detail View -> "🔗 Share"**
*   **Short Codes:** Instead of publishing a deck globally, users can click **Share** to generate a slick, 6-character Kahoot-style shortcode (e.g. `X8B3P9`).
*   **Code Import:** By entering the code via the **"Add Deck -> Import Code"** feature on the dashboard, friends or students can seamlessly download the exact deck sequence instantly.

---

## 🧠 3. AI Flashcard Pipeline (Powered by Groq)
The intelligence of the platform runs on prompt-engineered interactions with Groq Llama models.

*   **Global Generation:** Users can create an entire deck from scratch via the main menu by typing a prompt like *"Give me 10 aviation-related C1 terms"*
*   **Text & List Importer:** **(Location: Add Cards -> 📋 Import list)** Users can seamlessly paste a massive list of raw text or words (e.g., *Apfel, Haus, gehen*). The AI will process the raw text and automatically categorize, translate, and expand it into high-fidelity flashcards equipped with correct articles, syntax, and CEFR level matching.
*   **Context-Aware Inline AI adds:** Inside individual decks, hitting the AI Add button proactively scrapes up to 30 existing words in the deck, appending them directly to the AI's "Exclude" prompt so it **never accidentally generates duplicate terms**.
*   **Linguistic Precision:** The AI strictly supplies correct German formatting: exact articles (`der`/`die`/`das`), noun plural forms, explicit verb markers, and injects realistic German/English example sentences to give the vocabulary life.

---

## 👨‍🏫 4. Interactive AI Tutor
**Location: Hovering Menu / Inside Decks**
*   **Real-time Conversational Help:** Users get immediate access to an embedded AI Chat Assistant. By integrating deeply with the UI, users can ask "Why is this word Dative in this sentence?" or "Can you explain Adjective Declensions?", and instantly get nuanced, level-appropriate explanations without breaking their learning flow.

---

## 🃏 5. The Spaced Repetition Engine (SRS) & Study Modes
**Location:** **Inside specific Decks -> "Study"**
*   **SuperMemo-2 (SM2) Algorithm:** Dynamically modulates the `Easy Factor (EF)` and `Intervals` scaling based on the user's explicit 1-5 grading rating (1: Blackout, 3: Hard, 5: Perfect).
*   **4 Distinct Training Modes:**
    *   **SRS Classic:** Traditional flashcard flipping and 1-5 grading.
    *   **Quiz Mode:** Procedurally generated 4-option multiple-choice tests.
    *   **Writing Practice:** Strict input matching tests based on precise typing (case-sensitive configurations available).
    *   **Listening Quiz:** Uses Native Browser Web Speech API (`de-DE` voice mapping) to challenge users to transcribe spoken German without seeing the text.

### ⚠️ Weak Word Detection (Smart Routing)
*   **Algorithm:** Cards aggressively track a `confidenceScore` and `failureCount`. If confidence drops below 40% or a card is failed 3+ times, it is flagged as `⚠️ Weak`.
*   **Priority Action:** The SRS session intercepts weak words and algorithmically sorts them to **always appear first** in a given due session.
*   **Weak Word Dashboard:** Users can toggle the "Show Weak" filter in the Deck UI to isolate exactly which terms are severely degrading their retention rate.

---

## 🧭 6. Guided Learning & Gamification
**Location: Home Dashboard "Goal" section + Header**
*   **Learning Paths:** Users can launch a setup modal to pick a **Target Level** (A1–C2) and a **Timeframe** (30/60/90 days). The system strictly calculates the daily mathematical requirement needed to hit that benchmark in time.
*   **Daily Goals & Analytics:** A live progress widget continuously monitors the user, showing their daily elapsed targets (e.g. `4/10 Cards Today ✅`).
*   **Dynamic Streaks & XP:** Every single platform action generates lifetime XP. Streaks require daily authenticated activity.
*   **Global Leaderboard:** Ranks the top highest XP German learners live across the entire Deutsch Hub database, creating heavy competitive incentivization.

---

## 📱 7. Progressive Web App (PWA) Capabilities
*   **"Install App" Native Feel:** Through a fully customized `manifest.json` and a registered Service Worker (`sw.js`), the web platform can be installed natively onto the home screen of Android/iOS devices or desktops (macOS/Windows).
*   **Standalone Immersion:** Once installed, the browser URL bars are hidden, rendering a clean, distraction-free environment that operates visually identically to an App Store application.

---

*(Append new features below this line as the platform evolves)*
