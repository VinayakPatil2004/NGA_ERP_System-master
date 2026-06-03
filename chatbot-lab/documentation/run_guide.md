# 🚀 Standalone Chatbot Lab - Quickstart Guide

This guide describes how to run the **100% isolated Chatbot Lab sandbox** (both backend and premium frontend playground) independently of the main ERP system.

---

## 🛠️ Step 1: Install Dependencies
Open a terminal in the `/chatbot-lab` folder and run the installation script:

```bash
cd chatbot-lab
npm install
```
*This will install React, Vite, Lucide Icons, and the Mocha testing engine inside the isolated workspace.*

---

## 🤖 Step 2: Start the Backend Server
Launch the Express prototyping API (which handles Intent parsing, conversation history, and Gemini connections):

```bash
npm run backend
```
*The server will run on `http://localhost:5050`.*

---

## 🎨 Step 3: Start the Frontend Sandbox
Open a second terminal inside `/chatbot-lab` and spin up the developer playground:

```bash
npm run dev
```
*This will start a lightning-fast Vite dev server on `http://localhost:3000` and automatically open the playground page in your default browser!*

---

## ⚙️ Developer Console Capabilities
In the playground (`http://localhost:3000`), you will witness a premium dark-themed sandbox panel containing:
1. **Interactive Simulation Config**: Switch the logged-in user role between `parent` and `admin` on the fly to see how **Grace AI** adapts its suggestions and security policies.
2. **Real-Time HTTP Payload Console**: Real-time inspection logging that captures outgoing POST queries and incoming JSON response payloads from `http://localhost:5050` with elegant syntax formatting.
3. **Floating AI Assistant Drawer**: The active floating Grace AI assistant bubble on the bottom-right corner!
