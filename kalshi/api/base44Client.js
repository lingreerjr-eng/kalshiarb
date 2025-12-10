// Lightweight client shim to make the dashboard usable without a backend.
// Replace with real API wiring when integrating Kalshi and Ollama services.
const mockMarkets = [
  { market_id: 'KALS-BIN-24', title: 'Will BTC trade above $80k by Dec 2024?', yes_price: 42, no_price: 54, volume: 120000, status: 'active', category: 'crypto' },
  { market_id: 'KALS-CPI-SEP', title: 'Will September CPI exceed 3.5%?', yes_price: 36, no_price: 59, volume: 86000, status: 'active', category: 'macro' },
  { market_id: 'KALS-ELEX-2024', title: 'Will the incumbent party win the 2024 election?', yes_price: 48, no_price: 50, volume: 152000, status: 'active', category: 'politics' },
];

const mockTrades = [
  {
    market_id: 'KALS-BIN-24',
    strategy_type: 'leg_in_arbitrage',
    entry_leg: 'yes',
    entry_price: 42,
    target_exit_leg: 'no',
    target_exit_price: 35,
    current_status: 'monitoring_leg_2',
    total_cost_basis: 77,
    potential_profit: 23,
  },
];

const mockReports = [
  {
    market_query: 'What is the probability BTC trades above $80k by Dec 2024?',
    base_rate: 32,
    adjustment_factor: 15,
    final_probability: 47,
    created_date: new Date().toISOString(),
  },
];

const mockLogs = [
  {
    agent_name: 'ArbitrageBot',
    action: 'monitor_market',
    details: 'Scanning order book depth for KALS-BIN-24',
    timestamp: new Date().toISOString(),
  },
];

function simulateDelay(result) {
  return new Promise((resolve) => setTimeout(() => resolve(result), 150));
}

export const base44 = {
  entities: {
    Market: {
      list: async () => simulateDelay(mockMarkets),
    },
    ActiveTrade: {
      list: async () => simulateDelay(mockTrades),
    },
    ResearchReport: {
      list: async () => simulateDelay(mockReports),
    },
    AgentLog: {
      list: async (_query = {}) => simulateDelay(mockLogs),
    },
  },
  arbitrage: {
    setFocusedMarkets: async (marketIds) => {
      // In production, send this selection to the arbitrage engine.
      // This stub makes the UI deterministic for now.
      return simulateDelay({ focused: marketIds });
    },
  },
};
