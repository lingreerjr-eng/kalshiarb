import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kalshiClient } from '../api/kalshiClient';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Play, Pause, DollarSign, Timer, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Arbitrage() {
  const [isRunning, setIsRunning] = useState(true);
  const [selectedMarkets, setSelectedMarkets] = useState(new Set());
  const [executing, setExecuting] = useState(null);
  const [maxPositionCents, setMaxPositionCents] = useState(50000);
  const [minProfitCents, setMinProfitCents] = useState(10);
  const [killSwitch, setKillSwitch] = useState(false);
  const [toasts, setToasts] = useState([]);

  const { data: markets, isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: () => kalshiClient.entities.Market.list(),
    initialData: []
  });

  useEffect(() => {
    if (markets.length > 0) {
      setSelectedMarkets(new Set(markets.map((market) => market.market_id)));
    }
  }, [markets]);

  useEffect(() => {
    const focusedIds = Array.from(selectedMarkets);
    kalshiClient.arbitrage.setFocusedMarkets(focusedIds);
  }, [selectedMarkets]);

  const visibleMarkets = useMemo(() => {
    if (selectedMarkets.size === 0) return markets;
    return markets.filter((market) => selectedMarkets.has(market.market_id));
  }, [markets, selectedMarkets]);

  // Simulated logic to find leg-in opportunities
  const opportunities = visibleMarkets.map(market => {
    // Arbitrary target for demo: assuming we can buy the other side 10c cheaper than current if we wait
    const targetNoPrice = Math.max(1, market.no_price - 15);
    const totalCost = market.yes_price + targetNoPrice;
    const potentialProfit = 100 - totalCost;
    
    return {
      ...market,
      targetNoPrice,
      totalCost,
      potentialProfit,
      isViable: potentialProfit > 10 // Only show if >10c profit
    };
  }).filter(o => o.isViable);

  function pushToast({ title, description, variant = 'default' }) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }

  async function handleExecute(opp) {
    if (!isRunning) {
      pushToast({ title: 'Engine paused', description: 'Resume engine before executing trades.', variant: 'warning' });
      return;
    }
    if (killSwitch) {
      pushToast({ title: 'Kill-switch active', description: 'Orders blocked until kill-switch is disabled.', variant: 'error' });
      return;
    }
    if (opp.potential_profit < minProfitCents) {
      pushToast({ title: 'Risk gate blocked', description: 'Opportunity below min profit threshold.', variant: 'warning' });
      return;
    }

    const cost = opp.yes_price * 1;
    if (cost > maxPositionCents) {
      pushToast({ title: 'Position too large', description: `Cost ${cost}c exceeds cap ${maxPositionCents}c`, variant: 'error' });
      return;
    }

    setExecuting(opp.market_id);
    try {
      await kalshiClient.orders.place({
        ticker: opp.market_id,
        side: 'yes',
        price: opp.yes_price,
        size: 1,
        maxCostCents: maxPositionCents,
        killSwitch,
      });
      pushToast({
        title: 'Order submitted',
        description: `${opp.market_id} YES @ ${opp.yes_price}c`,
        variant: 'success',
      });
    } catch (err) {
      console.error(err);
      pushToast({ title: 'Order failed', description: err?.message || 'Check backend logs and credentials.', variant: 'error' });
    } finally {
      setExecuting(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Arbitrage Engine</h1>
          <p className="text-gray-400 font-mono text-sm">
            Strategy: <span className="text-emerald-400">LEG_IN_TIMED_ENTRY</span> • 
            Target ROI: <span className="text-emerald-400">{'>'}15%</span> • 
            Risk: <span className="text-yellow-400">MED</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg border border-gray-800">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-mono text-gray-400">{isRunning ? 'ENGINE ONLINE' : 'ENGINE PAUSED'}</span>
          </div>
          <Button 
            onClick={() => setIsRunning(!isRunning)}
            variant={isRunning ? "destructive" : "default"}
            className={isRunning ? "bg-red-900/20 text-red-400 hover:bg-red-900/40 border-red-900" : "bg-emerald-600 hover:bg-emerald-700"}
          >
            {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? 'Stop Engine' : 'Start Engine'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-emerald-500 ${isRunning ? 'animate-spin' : ''}`} />
              Live Opportunities
            </h2>
            <span className="text-xs text-gray-500 font-mono">
              {selectedMarkets.size || markets.length} MKTS SELECTED
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {opportunities.map((opp) => (
                <motion.div
                  key={opp.market_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#111214] border border-gray-800 rounded-xl p-4 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                >
                  {/* Decorative background pulse */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-all" />

                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700 text-[10px] tracking-wider">
                          {opp.market_id.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500 font-mono">Vol: {(opp.volume/1000).toFixed(1)}k</span>
                      </div>
                      <h3 className="font-medium text-gray-200">{opp.title}</h3>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        className="form-checkbox text-emerald-500"
                        checked={selectedMarkets.has(opp.market_id)}
                        onChange={() => {
                          setSelectedMarkets((prev) => {
                            const next = new Set(prev);
                            if (next.has(opp.market_id)) {
                              next.delete(opp.market_id);
                            } else {
                              next.add(opp.market_id);
                            }
                            return next;
                          });
                        }}
                      />
                      Focus market
                    </label>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400 font-mono flex items-center justify-end gap-1">
                        <DollarSign className="w-4 h-4" />
                        {opp.potential_profit}
                      </div>
                      <div className="text-xs text-emerald-600 font-mono">POTENTIAL PROFIT</div>
                    </div>
                  </div>

                  {/* Strategy Visualization */}
                  <div className="mt-6 bg-[#0a0a0c] rounded-lg p-3 border border-gray-800 relative">
                    <div className="flex items-center justify-between text-sm font-mono">
                      {/* Leg 1 */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-gray-500 text-xs">LEG 1 (NOW)</span>
                        <div className="px-3 py-1 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 rounded">
                          BUY YES @ {opp.yes_price}¢
                        </div>
                      </div>

                      {/* Arrow & Wait */}
                      <div className="flex-1 px-4 flex flex-col items-center">
                        <div className="h-px w-full bg-gray-700 relative top-3" />
                        <div className="p-1 bg-[#0a0a0c] relative z-10">
                          <Timer className="w-4 h-4 text-yellow-500" />
                        </div>
                        <span className="text-[10px] text-yellow-500 mt-1">WAIT TARGET</span>
                      </div>

                      {/* Leg 2 */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-gray-500 text-xs">LEG 2 (TARGET)</span>
                        <div className="px-3 py-1 bg-blue-900/20 border border-blue-500/30 text-blue-400 rounded dashed border-dashed">
                          BUY NO @ {opp.targetNoPrice}¢
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-800/50">
                      <span>Total Cost Basis: <span className="text-gray-300">{opp.totalCost}¢</span></span>
                      <span>Breakeven: <span className="text-gray-300">Target Hit</span></span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                     <Button
                       size="sm"
                       className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs"
                       onClick={() => handleExecute(opp)}
                       disabled={!!executing}
                     >
                       {executing === opp.market_id ? 'Submitting…' : 'EXECUTE STRATEGY'}
                     </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card className="bg-[#111214] border-gray-800 sticky top-6">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-4">
                <Settings className="w-4 h-4" />
                Execution Parameters
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase font-bold">Max Position Size (cents)</label>
                  <Input
                    type="number"
                    value={maxPositionCents}
                    onChange={(e) => setMaxPositionCents(Number(e.target.value))}
                    className="bg-[#0a0a0c] border-gray-700 text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase font-bold">Min Profit Margin (cents)</label>
                  <Input
                    type="number"
                    value={minProfitCents}
                    onChange={(e) => setMinProfitCents(Number(e.target.value))}
                    className="bg-[#0a0a0c] border-gray-700 text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase font-bold">Max Hold Time (Hours)</label>
                  <Input type="number" defaultValue={48} className="bg-[#0a0a0c] border-gray-700 text-white font-mono" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-900/40">
                  <div>
                    <p className="text-sm text-white font-semibold">Kill Switch</p>
                    <p className="text-xs text-gray-500">Block any automated orders instantly.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-red-500"
                    checked={killSwitch}
                    onChange={(e) => setKillSwitch(e.target.checked)}
                  />
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Risk Level</span>
                    <span className="text-yellow-400 font-bold">MEDIUM</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 w-1/2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="fixed bottom-6 right-6 z-50 space-y-2 w-80">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`p-4 rounded-lg border shadow-lg bg-gray-900/95 backdrop-blur text-white font-mono text-sm border-gray-800 ${
                toast.variant === 'success'
                  ? 'border-emerald-500/50'
                  : toast.variant === 'error'
                  ? 'border-red-500/50'
                  : toast.variant === 'warning'
                  ? 'border-yellow-500/50'
                  : ''
              }`}
            >
              <div className="font-semibold">{toast.title}</div>
              <div className="text-gray-400 text-xs mt-1">{toast.description}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}