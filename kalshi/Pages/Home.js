import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowUpRight, TrendingUp, AlertTriangle, FileText, Cpu, Clock, Bot, Microscope, Wallet } from "lucide-react";
import { kalshiClient } from '../api/kalshiClient';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function Home() {
  const { data: activeTrades } = useQuery({
    queryKey: ['activeTrades'],
    queryFn: () => kalshiClient.entities.ActiveTrade.list(),
    initialData: []
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => kalshiClient.entities.ResearchReport.list(),
    initialData: []
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => kalshiClient.account.portfolio(),
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Command Center</h1>
          <p className="text-gray-400">System overview and performance metrics</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-emerald-900/20 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="font-mono font-bold">ALPHA: +12.4%</span>
          </div>
          <div className="px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-400 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span className="font-mono font-bold">AGENTS: 4/5 BUSY</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Arbs', value: activeTrades.length, icon: TrendingUp, color: 'text-emerald-400', sub: '2 pending fill' },
          { label: 'Research Queue', value: '3', icon: FileText, color: 'text-blue-400', sub: '1 processing' },
          { label: 'Capital Deployed', value: portfolio?.total_value ? `$${portfolio.total_value}` : '$—', icon: ArrowUpRight, color: 'text-purple-400', sub: 'Live from Kalshi' },
          { label: 'System Uptime', value: '99.9%', icon: Clock, color: 'text-yellow-400', sub: 'Last restart: 4d ago' },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#111214] border-gray-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-white mt-2 font-mono">{stat.value}</h3>
                  <p className="text-xs text-gray-600 mt-1">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gray-900 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Arbitrage Ops */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-500" />
              Live Arbitrage Ops
            </h2>
          </div>
          
          <div className="bg-[#111214] border border-gray-800 rounded-xl overflow-hidden">
            {activeTrades.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-[#0a0a0c] text-xs uppercase text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Market</th>
                    <th className="px-6 py-4">Strategy</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Proj. Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {activeTrades.map((trade, i) => (
                    <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-emerald-400 text-sm">{trade.market_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-blue-900/10 text-blue-400 border-blue-800">
                          {trade.strategy_type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <div className={`w-1.5 h-1.5 rounded-full ${trade.current_status === 'monitoring_leg_2' ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`} />
                          {trade.current_status.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-400">
                        +${trade.potential_profit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No active arbitrage operations detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Intelligence */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Microscope className="w-5 h-5 text-blue-500" />
              Intelligence Feed
            </h2>
          </div>

          <div className="space-y-4">
            {reports.length > 0 ? (
              reports.map((report, i) => (
                <Card key={i} className="bg-[#111214] border-gray-800 hover:border-gray-700 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700 text-xs">
                        REPORT #{String(1000 + i).slice(-4)}
                      </Badge>
                      <span className="text-xs text-gray-600 font-mono">
                        {report.created_date ? format(new Date(report.created_date), 'HH:mm') : 'Just now'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-200 group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                      {report.market_query}
                    </h3>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-gray-500">
                        Prob: <span className="text-white font-mono">{report.final_probability}%</span>
                      </div>
                      <div className="flex gap-1">
                        {[1,2,3].map(d => (
                           <div key={d} className="w-1 h-1 bg-gray-600 rounded-full" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-[#111214] border-gray-800 border-dashed">
                <CardContent className="p-8 text-center text-gray-600">
                  <p>Intelligence queue empty.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              Portfolio Health
            </h2>
          </div>
          <Card className="bg-[#111214] border-gray-800">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <p className="text-gray-500">Buying Power</p>
                  <p className="text-white text-xl">{portfolio?.buying_power ? `$${portfolio.buying_power}` : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cash</p>
                  <p className="text-white text-xl">{portfolio?.cash ? `$${portfolio.cash}` : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Margin Used</p>
                  <p className="text-white text-xl">{portfolio?.margin ? `$${portfolio.margin}` : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Leverage</p>
                  <p className="text-white text-xl">{portfolio?.leverage ?? '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/60">
                  <p className="text-gray-500">Realized PnL</p>
                  <p className={`text-xl ${portfolio?.pnl?.realized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {portfolio?.pnl?.realized ?? '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/60">
                  <p className="text-gray-500">Unrealized PnL</p>
                  <p className={`text-xl ${portfolio?.pnl?.unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {portfolio?.pnl?.unrealized ?? '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-2">Recent Orders</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(portfolio?.open_orders ?? []).map((order, idx) => (
                    <div key={order.order_id || idx} className="flex items-center justify-between text-xs text-gray-300 p-2 rounded border border-gray-800 bg-gray-900/60">
                      <span className="font-mono text-emerald-400">{order.ticker}</span>
                      <span className="font-mono">{order.side?.toUpperCase()} @ {order.price}c</span>
                      <span className="text-gray-500">{order.status || 'submitted'}</span>
                    </div>
                  ))}
                  {(portfolio?.open_orders ?? []).length === 0 && (
                    <p className="text-gray-600 text-xs">No recent orders tracked.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}