import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import { promises as fs } from 'fs';

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
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Rate limit exceeded. Please reduce request frequency.' },
  })
);

const PORT = process.env.PORT || 4000;
const API_BASE = process.env.KALSHI_API_BASE || 'https://trading-api.kalshi.com/v2';
const API_KEY = process.env.KALSHI_API_KEY;
const API_SECRET = process.env.KALSHI_API_SECRET;
const ALLOWED_CATEGORIES = (process.env.KALSHI_ALLOWED_CATEGORIES || 'sports,crypto,financials')
  .split(',')
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_PATH = path.join(DATA_DIR, 'state.json');

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
  persistedOrders: [],
};

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadPersistentState() {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    state.focusedMarkets = new Set(parsed.focusedMarkets || []);
    state.persistedOrders = parsed.orders || [];
  } catch (err) {
    // Ignore missing file on first boot
    if (err.code !== 'ENOENT') {
      console.error('Failed to load persistent state', err);
    }
  }
}

async function savePersistentState() {
  const payload = {
    focusedMarkets: Array.from(state.focusedMarkets),
    orders: state.persistedOrders,
  };
  await ensureDataDir();
  await fs.writeFile(DATA_PATH, JSON.stringify(payload, null, 2));
}

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

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
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

app.get('/api/markets', asyncHandler(async (_req, res) => {
  if (!ensureAuth(res)) return;
  const markets = await loadAllowedMarkets();
  return res.json({ markets });
}));

app.get('/api/trades', asyncHandler(async (_req, res) => {
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
}));

app.get('/api/account', asyncHandler(async (_req, res) => {
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
}));

app.get('/api/portfolio', asyncHandler(async (_req, res) => {
  if (!ensureAuth(res)) return;
  const data = await fetchKalshi('/portfolio');
  if (!data) return res.status(502).json({ error: 'Unable to fetch portfolio from Kalshi' });
  const portfolio = {
    buying_power: data.buying_power ?? data.available_balance ?? null,
    cash: data.cash ?? null,
    positions: data.positions ?? [],
    total_value: data.total_value ?? null,
    pnl: {
      realized: data.realized_pnl ?? 0,
      unrealized: data.unrealized_pnl ?? 0,
    },
    margin: data.margin_used ?? null,
    leverage: data.leverage ?? null,
    open_orders: state.persistedOrders,
  };
  res.json({ portfolio });
}));

app.get('/api/logs', (_req, res) => {
  res.json({ logs: state.logs });
});

app.get('/api/research', (_req, res) => {
  res.json({ reports: state.research });
});

app.post('/api/orders', asyncHandler(async (req, res) => {
  if (!ensureAuth(res)) return;
  const { ticker, side, price, size, type = 'limit', maxCostCents, killSwitch } = req.body || {};
  if (!ticker || !side || !price || !size) {
    return res.status(400).json({ error: 'ticker, side, price, and size are required' });
  }

  const cost = Number(price) * Number(size);
  if (maxCostCents && cost > maxCostCents) {
    return res.status(400).json({ error: `Order blocked: cost ${cost} exceeds maxCostCents ${maxCostCents}` });
  }
  if (killSwitch) {
    return res.status(400).json({ error: 'Kill-switch active: refusing to place orders.' });
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
  state.persistedOrders.unshift({
    ticker,
    side,
    price,
    size,
    placed_at: new Date().toISOString(),
    status: result.status ?? 'submitted',
    order_id: result.id ?? result.order_id ?? undefined,
  });
  state.persistedOrders = state.persistedOrders.slice(0, 100);
  await savePersistentState();
  res.json({ order: result });
}));

app.post('/api/arbitrage/focus', asyncHandler(async (req, res) => {
  const { marketIds } = req.body ?? {};
  if (Array.isArray(marketIds)) {
    state.focusedMarkets = new Set(marketIds);
    await savePersistentState();
  }
  res.json({ focused: Array.from(state.focusedMarkets) });
}));

app.get('/api/markets/:ticker/orderbook/stream', asyncHandler(async (req, res) => {
  if (!ensureAuth(res)) return;
  const { ticker } = req.params;
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();

  let active = true;
  req.on('close', () => {
    active = false;
  });

  async function pushSnapshot() {
    if (!active) return;
    const snapshot = await fetchKalshi(`/markets/${ticker}/orderbook`);
    if (snapshot) {
      res.write(`event: depth\n`);
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
    }
  }

  // send first snapshot immediately then poll every 5s
  await pushSnapshot();
  const interval = setInterval(pushSnapshot, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
}));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Unexpected server error', detail: err?.message });
});

loadPersistentState().finally(() => {
  app.listen(PORT, () => {
    console.log(`Kalshi arb backend listening on port ${PORT}`);
  });
});
