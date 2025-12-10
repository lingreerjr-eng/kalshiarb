# Kalshi Arbitrage Bot + Research AI

## Overview
This repository now includes a minimal backend + frontend pairing for a Kalshi-focused arbitrage dashboard and research assistant. The backend proxies to Kalshi with credential-based requests and filters to live **Sports, Crypto, and Financials** markets. The frontend renders live markets, trades, research context, and lets you focus the arbitrage engine on specific markets via per-market checkboxes.

## Core Features
- **Backend proxy:** Express server that reads Kalshi credentials from the environment, fetches **live Sports, Crypto, and Financials markets** from the Kalshi Trading API, and stores focused market selections server-side.
- **Dashboard:** Live view of trades, research queue, and operational status.
- **Arbitrage Engine UI:** Visualizes leg-in arbitrage opportunities and lets you focus on specific markets independently with checkboxes.
- **Research Analyst:** Structured research cards that can be backed by Ollama-powered analysis.
- **System Logs:** Stream-style view of recent agent activity pulled from the backend.

## Folder Structure
```
backend/
  package.json           # Express backend dependencies
  server.js              # API proxy (Kalshi live data + deterministic logs/research placeholders)
kalshi/
  api/
    kalshiClient.js      # Frontend client that talks to the backend API
  Entities/              # JSON schemas describing domain entities
  Layout.js              # Application shell (navigation + chrome)
  Pages/                 # React pages (Arbitrage, Research, Home, Logs, Docs, Settings)
README.md
```

## Requirements
- **Node.js**: 18+ recommended.
- **Package manager**: npm or pnpm.
- **Ollama**: Local model runtime (e.g., `ollama pull llama3` or other supported models) for research tasks.
- **Kalshi API access**: Live API key/secret for trading. Without credentials the API returns `401` to make missing auth obvious.

## Environment Variables
Set sensitive values via a `.env` file or your process manager (do not commit credentials):
```
# Backend (backend/.env)
PORT=4000
KALSHI_API_BASE=https://trading-api.kalshi.com/v2
KALSHI_ALLOWED_CATEGORIES=sports,crypto,financials
KALSHI_API_KEY=your_api_key
KALSHI_API_SECRET=your_api_secret

# Frontend
VITE_BACKEND_URL=http://localhost:4000/api
OLLAMA_HOST=http://localhost:11434
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```
Use OS-level secret stores or deployment-specific secret managers for production.

## Installation (macOS & Linux)
1. Install Node.js (via [nvm](https://github.com/nvm-sh/nvm) or your package manager).
2. Clone the repository:
   ```bash
   git clone <repo-url>
   cd kalshiarb
   ```
3. Install backend dependencies and start the API proxy (requires valid Kalshi credentials for live data):
   ```bash
   cd backend
   npm install
   npm start
   ```
4. In a separate terminal, install frontend dependencies (if not already installed for your React app) and start the dashboard. Ensure your tooling resolves `@/components/ui/*` to your design system or replace those imports with equivalents.
   ```bash
   cd ..
   npm install  # if your frontend package.json exists alongside this repo
   npm run dev
   ```

## Running the Backend Arbitrage Engine
- The backend currently exposes REST endpoints for markets, trades (open orders), research reports, logs, focused market updates, account summary, and order placement.
- With Kalshi credentials set, `/api/markets` fetches live Sports, Crypto, and Financials markets from Kalshi using `/markets?category=...` filters. Missing credentials return `401` to avoid silent fallbacks.
- The `/api/orders` endpoint forwards limit orders so the AI can buy/sell on your behalf; ensure prices/sizes are safe before enabling.
- The `/api/arbitrage/focus` endpoint stores the checkbox-selected markets so the arbitrage loop can scope scans and orders to those tickers.

## Running the Frontend Dashboard
- Configure `VITE_BACKEND_URL` (or equivalent env var for your bundler) to point to the backend API, defaulting to `http://localhost:4000/api`.
- Start your frontend dev server (e.g., `npm run dev`).
- Navigate to the Arbitrage page to select markets; selections are sent to the backend.

## Research AI & Ollama Integration
- The research UI can be wired to an Ollama-backed service that generates probability estimates and scenarios.
- Point your research service to `OLLAMA_HOST` (default `http://localhost:11434`) and return structured results matching `kalshi/Pages/Research.js` expectations.
- Orders are sent to `/api/orders`; wire your AI to call that endpoint with safe sizing/limits to execute trades.

## Market-Specific Arbitrage via Checkboxes
- On the **Arbitrage** page, each opportunity has an independent checkbox.
- Selecting a checkbox triggers `kalshiClient.arbitrage.setFocusedMarkets`, which calls the backend to persist the list and constrain the arbitrage engine to those markets.
- Only Sports, Crypto, and Financials markets are fetched from Kalshi by default; adjust `KALSHI_ALLOWED_CATEGORIES` if you need more coverage.

## Deployment / Hosting
- Deploy the backend behind HTTPS with environment-injected Kalshi credentials. Ensure proper rate-limit handling and add real order placement logic before trading live capital.
- Build and host the frontend via your preferred CDN/edge platform, pointing `VITE_BACKEND_URL` to the deployed backend.
- Secure secrets server-side; never expose Kalshi keys in the browser.

## Troubleshooting
- **CORS/connection errors**: Confirm `VITE_BACKEND_URL` matches the running backend and that CORS is allowed in your backend server.
- **No real data**: Ensure `KALSHI_API_KEY` and `KALSHI_API_SECRET` are set; the API now requires credentials and returns `401` when absent.
- **Orders rejected**: Check backend logs for Kalshi API errors and confirm your price/size is within market bounds and buying power.
- **Ollama connection errors**: Verify `OLLAMA_HOST` is reachable and `ollama serve` is running; pull the expected model.
- **Checkboxes not affecting scans**: Confirm the backend receives `/api/arbitrage/focus` calls and applies the selection to your arbitrage loop.

## Example Commands
```bash
# Start Ollama locally
ollama serve

# Pull a model for research
ollama pull llama3

# Start the backend proxy (requires Kalshi credentials)
cd backend && npm install && npm start

# Run the frontend (ensure your own package.json / tooling is present)
npm run dev

# Submit an example order from the frontend arbitrage card
# (requires valid creds + buying power)
# Click EXECUTE STRATEGY to send a yes-limit order at the displayed price.

## Upgrading the AI + Execution Stack
- Swap the alert in `kalshi/Pages/Arbitrage.js` with a toast/notification system and connect the AI loop so it calls `kalshiClient.orders.place` with validated risk controls.
- Extend `backend/server.js` to persist focused markets and orders (e.g., Redis/Postgres) and to stream Kalshi order book depth for better arbitrage timing.
- Add portfolio polling (e.g., `/portfolio`) on an interval to display live PnL, margin, and position deltas in the UI.
- Harden error handling and rate limiting on the backend before deploying to production traffic.
```

## Limitations
- Trades/logs/research endpoints still return deterministic data; wire them to Kalshi account endpoints and persistent storage before production use.
- Order placement is forwarded to Kalshi, but no risk checks, hedging, or kill-switches are implemented. Add guards before live trading.
- The UI references shared component libraries (`@/components/ui/*`) that must exist in your build environment.
