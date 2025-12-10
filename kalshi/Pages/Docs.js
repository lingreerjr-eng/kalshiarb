import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Book, Terminal, Cpu, TrendingUp } from "lucide-react";

export default function Docs() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Book className="w-6 h-6 text-emerald-500" />
          <h1 className="text-3xl font-bold text-white">Documentation</h1>
        </div>
        <p className="text-gray-400">System manual for QUANTOS v2.0</p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Overview</h2>
          <Card className="bg-[#111214] border-gray-800">
            <CardContent className="p-6 text-gray-300 space-y-4 leading-relaxed">
              <p>
                QUANTOS is an advanced platform designed to leverage prediction markets like Kalshi through automated arbitrage strategies and institutional-grade research.
              </p>
              <p>
                It combines a high-frequency <strong className="text-white">Arbitrage Engine</strong> with an <strong className="text-white">Autonomous Research Analyst</strong> swarm to provide structural alpha.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Arbitrage Engine
          </h2>
          <div className="grid gap-4">
            <div className="bg-[#0a0a0c] p-4 rounded-lg border border-gray-800">
              <h3 className="font-bold text-white mb-2">Leg-In Timed Entry Strategy</h3>
              <p className="text-sm text-gray-400">
                Automatically identifies and visualizes arbitrage opportunities where buying one leg now and the opposite leg later results in a guaranteed profit.
                Formula: <code className="bg-gray-800 px-1 py-0.5 rounded text-emerald-400">Price(Yes) + Price(No) &lt; 100¢</code>
              </p>
            </div>
            <div className="bg-[#0a0a0c] p-4 rounded-lg border border-gray-800">
              <h3 className="font-bold text-white mb-2">Real-time Scanning</h3>
              <p className="text-sm text-gray-400">
                Monitors markets for optimal entry points based on predefined parameters (min profit, max hold time).
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" /> Research Analyst
          </h2>
          <Card className="bg-[#111214] border-gray-800">
            <CardContent className="p-6 text-gray-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Reference Class Forecasting:</strong> Decomposes questions into measurable factors and calculates base rates from historical data.</li>
                <li><strong className="text-white">Agent Swarm:</strong> Utilizes specialized agents (Factor, Historical, Scenario) to parallelize research.</li>
                <li><strong className="text-white">Visual Output:</strong> Generates probability distributions, factor scatter plots, and scenario models.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-gray-500" /> Setup & Configuration
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">1. Backend Configuration</h3>
              <p className="text-sm text-gray-400">
                To enable automated trading and real-time data, you must configure the backend integration with Kalshi and your Ollama instance.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">2. App Settings</h3>
              <p className="text-sm text-gray-400">
                Navigate to <code className="text-blue-400">/settings</code> to configure:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-400 ml-4">
                <li>Ollama API URL (e.g., http://localhost:11434)</li>
                <li>Discord Webhook URL for alerts</li>
                <li>Kalshi API Keys</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}