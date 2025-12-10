import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  Microscope, 
  Settings, 
  Terminal, 
  Activity,
  Cpu,
  Book
} from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Arb Engine', icon: Bot, path: '/arbitrage' },
    { name: 'Research Analyst', icon: Microscope, path: '/research' },
    { name: 'System Logs', icon: Terminal, path: '/logs' },
    { name: 'Documentation', icon: Book, path: '/docs' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-gray-300 font-mono selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 flex flex-col bg-[#0f1012]">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 text-emerald-500">
            <Cpu className="w-6 h-6" />
            <span className="font-bold text-lg tracking-wider text-white">QUANT<span className="text-emerald-500">OS</span></span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#0a0a0c]">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>LLM CONNECTION</span>
            <span className="text-emerald-500">ACTIVE</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[92%]" />
          </div>
          <div className="mt-4 text-xs font-mono text-gray-600 text-center">
            {currentTime.toISOString().split('.')[0]} UTC
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#0a0a0c] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 opacity-50" />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}