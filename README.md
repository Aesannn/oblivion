# OBLIVION: Financial Intelligence OS

OBLIVION is a production-grade Financial Intelligence and Tactical Command OS. It provides real-time transaction monitoring, risk vector analysis, and AI-driven threat intelligence.

![OBLIVION Dashboard](./dashboard.png)

## Features
- **Holographic Tactical Map**: Real-time geolocation of global financial transactions.
- **Anomaly Clusters**: Staggered radial visualization of risk sectors.
- **AI Intel Engine**: Integrated Gemini-powered reasoning for tactical summaries and directives.
- **Live Intelligence Pulse**: High-frequency data stream monitoring.
- **Tactical Alerts**: Instant threat detection with high-visibility overlays.
- **Full Mobile Responsiveness**: Seamless operation across workstations and mobile tactical units.

## Tech Stack
- **Frontend**: Next.js 16, Tailwind CSS 4, Framer Motion, Recharts, Socket.io-client.
- **Backend**: Node.js, Socket.io, Google Gemini API.

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `server/` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file and add your `GEMINI_API_KEY`.
4. Start the server: `npm run dev`

### 2. Frontend Setup
1. Navigate to the `client/` directory.
2. Install dependencies: `npm install`
3. Start the application: `npm run dev`
4. Open `http://localhost:3000` in your browser.

## Deployment
This project is optimized for deployment on **Vercel** (client) and any Node.js environment (server).
