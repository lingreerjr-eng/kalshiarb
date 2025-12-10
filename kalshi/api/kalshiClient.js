const API_BASE = import.meta?.env?.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const kalshiClient = {
  entities: {
    Market: {
      list: async () => {
        const { markets } = await request('/markets');
        return markets;
      },
    },
    ActiveTrade: {
      list: async () => {
        const { trades } = await request('/trades');
        return trades;
      },
    },
    ResearchReport: {
      list: async () => {
        const { reports } = await request('/research');
        return reports;
      },
    },
    AgentLog: {
      list: async (query = {}) => {
        const params = new URLSearchParams();
        if (query.limit) params.set('limit', query.limit);
        const qs = params.toString();
        const { logs } = await request(`/logs${qs ? `?${qs}` : ''}`);
        return logs;
      },
    },
  },
  arbitrage: {
    setFocusedMarkets: async (marketIds) => {
      const { focused } = await request('/arbitrage/focus', {
        method: 'POST',
        body: { marketIds },
      });
      return focused;
    },
  },
  account: {
    summary: async () => {
      const { portfolio } = await request('/account');
      return portfolio;
    },
  },
  orders: {
    place: async (order) => {
      const { order: result } = await request('/orders', {
        method: 'POST',
        body: order,
      });
      return result;
    },
  },
};
