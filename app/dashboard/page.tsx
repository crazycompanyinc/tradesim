'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, BarChart3, Clock, Trash2, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/Layout';
import type { BacktestSession } from '@/types';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<BacktestSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) setSessions(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    totalPnl: sessions.reduce((s, sess) => s + (sess.totalPnl || 0), 0),
    avgWinRate: sessions.length > 0
      ? sessions.filter(s => s.status === 'completed').reduce((s, sess) => s + (sess.winRate || 0), 0) / Math.max(sessions.filter(s => s.status === 'completed').length, 1)
      : 0,
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sessions', value: stats.total, icon: BarChart3, color: '#2962ff' },
            { label: 'Completed', value: stats.completed, icon: Clock, color: '#26a69a' },
            { label: 'Total P&L', value: `$${stats.totalPnl.toFixed(2)}`, icon: stats.totalPnl >= 0 ? TrendingUp : TrendingDown, color: stats.totalPnl >= 0 ? '#26a69a' : '#ef5350' },
            { label: 'Avg Win Rate', value: `${stats.avgWinRate.toFixed(1)}%`, icon: Target, color: '#ff9800' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#787b86]">{stat.label}</span>
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Backtest Sessions</h2>
          <Link href="/backtest/new" className="btn btn-primary text-sm">
            <Plus size={14} />
            New Session
          </Link>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="text-center py-12 text-[#787b86]">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-12">
            <BarChart3 size={40} className="mx-auto mb-4 text-[#2B2B43]" />
            <h3 className="text-white font-medium mb-2">No sessions yet</h3>
            <p className="text-sm text-[#787b86] mb-4">Create your first backtest session to get started</p>
            <Link href="/backtest/new" className="btn btn-primary">
              <Plus size={14} />
              Create Session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/backtest/${session.id}`}
                  className="card flex items-center justify-between hover:border-[#2962ff]/30 transition-all group block"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      session.status === 'completed' ? 'bg-[#26a69a]' :
                      session.status === 'running' ? 'bg-[#ff9800]' :
                      'bg-[#787b86]'
                    }`} />
                    <div>
                      <div className="text-white font-medium text-sm">{session.name}</div>
                      <div className="text-xs text-[#787b86]">
                        {session.symbol} · {session.timeframe} · ${session.startBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {session.status === 'completed' && (
                      <>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${(session.totalPnl || 0) >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                            {(session.totalPnl || 0) >= 0 ? '+' : ''}{session.totalPnl?.toFixed(2)}
                          </div>
                          <div className="text-xs text-[#787b86]">{session.totalTrades} trades</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">{session.winRate?.toFixed(1)}%</div>
                          <div className="text-xs text-[#787b86]">win rate</div>
                        </div>
                      </>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      session.status === 'completed' ? 'bg-[#26a69a]/10 text-[#26a69a]' :
                      session.status === 'running' ? 'bg-[#ff9800]/10 text-[#ff9800]' :
                      'bg-[#2B2B43] text-[#787b86]'
                    }`}>
                      {session.status}
                    </span>
                    <ArrowRight size={14} className="text-[#787b86] group-hover:text-[#2962ff] transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Target(props: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
