import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 4000;
const API_BASE = process.env.KALSHI_API_BASE || 'https://trading-api.kalshi.com/v2';
const API_KEY = process.env.KALSHI_API_KEY;
const API_SECRET = process.env.KALSHI_API_SECRET;
const ALLOWED_CATEGORIES = (process.env.KALSHI_ALLOWED_CATEGORIES || 'sports,crypto,financials')
  .split(',')
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);

const state = {
  logs: [
    {
      agent_name: 'ArbitrageBot',
      action: 'monitor_market',
      details: 'Initialized arbitrage loop',
      timestamp: new Date().toISOString(),
    },
  ],
  research: [
    {
      market_query: 'What is the probability BTC trades above $80k by Dec 2024?',
      base_rate: 32,
      adjustment_factor: 15,
      final_probability: 47,
      created_date: new Date().toISOString(),
    },
  ],
  focusedMarkets: new Set(),
};

function authHeader() {
  if (!API_KEY || !API_SECRET) return {};
  const token = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

function ensureAuth(res) {
  if (!API_KEY || !API_SECRET) {
    res.status(401).json({ error: 'Kalshi credentials are required in KALSHI_API_KEY and KALSHI_API_SECRET' });
    return false;
  }
  return true;
}

async function fetchKalshi(path, options = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error('Kalshi API error', resp.status, text);
    return null;
  }

  if (resp.status === 204) return null;
  return resp.json();
}

async function fetchMarketsByCategory(category) {
  const params = new URLSearchParams({
    category,
    status: 'active',
    limit: '200',
  });
  return fetchKalshi(`/markets?${params.toString()}`);
}

async function loadAllowedMarkets() {
  const markets = [];
  const seen = new Set();

  for (const category of ALLOWED_CATEGORIES) {
    const data = await fetchMarketsByCategory(category);
    if (data?.markets) {
      data.markets.forEach((m) => {
        const marketId = m.ticker ?? m.id;
        if (!marketId || seen.has(marketId)) return;
        seen.add(marketId);

        markets.push({
          market_id: marketId,
          title: m.name ?? m.title,
          yes_price: m.yes_price ?? m.last_yes_price,
          no_price: m.no_price ?? m.last_no_price,
          volume: m.volume ?? m.yes_volume ?? 0,
          status: m.state ?? m.status ?? 'active',
          category: m.category ?? category,
        });
      });
    }
  }

  return markets;
}

app.get('/api/markets', async (_req, res) => {
  if (!ensureAuth(res)) return;
  const markets = await loadAllowedMarkets();
  return res.json({ markets });
});

app.get('/api/trades', async (_req, res) => {
  if (!ensureAuth(res)) return;
  const data = await fetchKalshi('/orders?status=open');
  const trades = Array.isArray(data?.orders)
    ? data.orders.map((o) => ({
        market_id: o.ticker ?? o.market_ticker,
        strategy_type: o.strategy ?? 'live_order',
        entry_leg: o.side ?? o.direction,
        entry_price: o.price ?? o.limit_price,
        quantity: o.size ?? o.quantity,
        current_status: o.status,
        total_cost_basis: o.cost_basis ?? null,
        potential_profit: o.max_profit ?? null,
      }))
    : [];
  res.json({ trades });
});

app.get('/api/account', async (_req, res) => {
  if (!ensureAuth(res)) return;
  const data = await fetchKalshi('/portfolio');
  if (!data) return res.status(502).json({ error: 'Unable to fetch portfolio from Kalshi' });
  const portfolio = {
    buying_power: data.buying_power ?? data.available_balance ?? null,
    cash: data.cash ?? null,
    positions: data.positions ?? [],
    total_value: data.total_value ?? null,
    pnl: data.realized_pnl ?? data.unrealized_pnl ?? null,
  };
  res.json({ portfolio });
});

app.get('/api/logs', (_req, res) => {
  res.json({ logs: state.logs });
});

app.get('/api/research', (_req, res) => {
  res.json({ reports: state.research });
});

app.post('/api/orders', async (req, res) => {
  if (!ensureAuth(res)) return;
  const { ticker, side, price, size, type = 'limit' } = req.body || {};
  if (!ticker || !side || !price || !size) {
    return res.status(400).json({ error: 'ticker, side, price, and size are required' });
  }

  const payload = {
    ticker,
    type,
    side,
    price,
    size,
    time_in_force: 'GTC',
  };

  const result = await fetchKalshi('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!result) return res.status(502).json({ error: 'Order rejected by Kalshi' });
  res.json({ order: result });
});

app.post('/api/arbitrage/focus', (req, res) => {
  const { marketIds } = req.body ?? {};
  if (Array.isArray(marketIds)) {
    state.focusedMarkets = new Set(marketIds);
  }
  res.json({ focused: Array.from(state.focusedMarkets) });
});

app.listen(PORT, () => {
  console.log(`Kalshi arb backend listening on port ${PORT}`);
});
