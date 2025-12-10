import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { kalshiClient } from '../api/kalshiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, RefreshCw, Filter } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";

export default function Logs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => kalshiClient.entities.AgentLog.list({ sort: { timestamp: -1 }, limit: 50 }),
    initialData: []
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Logs</h1>
          <p className="text-gray-400">Real-time agent activity stream.</p>
        </div>
        <div className="flex gap-2">
           {/* Mock filters for visual completeness */}
           <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700 cursor-pointer">ALL</Badge>
           <Badge variant="outline" className="border-gray-800 text-gray-500 cursor-pointer hover:text-gray-300">ERRORS</Badge>
           <Badge variant="outline" className="border-gray-800 text-gray-500 cursor-pointer hover:text-gray-300">TRADES</Badge>
        </div>
      </div>

      <Card className="bg-[#0a0a0c] border-gray-800 font-mono text-sm">
        <CardHeader className="border-b border-gray-800 py-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Terminal className="w-4 h-4" />
            <span>Console Output</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800/50">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 p-3 hover:bg-gray-900/50 transition-colors">
                <div className="w-32 text-gray-600 shrink-0">
                  {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss.dS') : '--:--:--'}
                </div>
                <div className="w-32 font-bold shrink-0">
                  <span className={`
                    ${log.agent_name === 'ArbitrageBot' ? 'text-emerald-500' : ''}
                    ${log.agent_name === 'FactorAgent' ? 'text-blue-500' : ''}
                    ${log.agent_name === 'HistoricalAgent' ? 'text-purple-500' : ''}
                    ${log.agent_name === 'ScenarioAgent' ? 'text-orange-500' : ''}
                  `}>
                    [{log.agent_name}]
                  </span>
                </div>
                <div className="flex-1 text-gray-300">
                  <span className="font-semibold text-gray-400 mr-2">{log.action}:</span>
                  {log.details}
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="p-8 text-center text-gray-600">
                No logs available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}