'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/dashboard/Layout';
import {
  Play, Pause, Square, SkipForward, RotateCcw,
  TrendingUp, TrendingDown, Target, BarChart3,
  Activity, Zap, Settings, Download, ChevronDown
} from 'lucide-react';
import type { Candle, BacktestSession, Trade, BacktestResults } from '@/types';

// Dynamic import for chart (no SSR — lightweight-charts requires browser)
const TradingChart = dynamic(() => import('@/components/chart/TradingChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-[#131722] rounded-lg flex items-center justify-center">
      <div className="text-[#787b86] text-sm">Loading chart...</div>
    </div>
  ),
});

export default function BacktestPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<BacktestSession | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [results, setResults] = useState<BacktestResults['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'results' | 'trades'>('chart');

  // Replay state
  const [replayMode, setReplayMode] = useState(false);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Indicator config
  const [indicators, setIndicators] = useState({
    sma: [20],
    ema: [] as number[],
    bollinger: false,
  });
  const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);

  // Strategy config
  const [strategyConfig, setStrategyConfig] = useState({
    fastPeriod: 10,
    slowPeriod: 30,
    stopLossPct: 2,
    takeProfitPct: 4,
    useRSI: false,
  });

  // Load session data
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const [sessRes, candlesRes, resultsRes] = await Promise.all([
        fetch(`/api/sessions/${sessionId}`, { credentials: 'include' }),
        fetch(`/api/sessions/${sessionId}/candles`, { credentials: 'include' }),
        fetch(`/api/sessions/${sessionId}/results`, { credentials: 'include' }),
      ]);

      const sessData = await sessRes.json();
      const candlesData = await candlesRes.json();
      const resultsData = await resultsRes.json();

      if (sessData.success) setSession(sessData.data);
      if (candlesData.success) setCandles(candlesData.data);
      if (resultsData.success) {
        setResults(resultsData.data.summary);
        setTrades(resultsData.data.trades);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load market data
  const loadData = async (count: number = 500) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/candles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (data.success) {
        // Reload candles
        const candlesRes = await fetch(`/api/sessions/${sessionId}/candles`, { credentials: 'include' });
        const candlesData = await candlesRes.json();
        if (candlesData.success) setCandles(candlesData.data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  // Run backtest
  const runBacktest = async () => {
    if (candles.length < 50) {
      alert('Load data first (need at least 50 candles)');
      return;
    }
    setRunning(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(strategyConfig),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data.summary);
        setTrades(data.data.trades);
        setActiveTab('results');
        // Reload session
        const sessRes = await fetch(`/api/sessions/${sessionId}`, { credentials: 'include' });
        const sessData = await sessRes.json();
        if (sessData.success) setSession(sessData.data);
      }
    } catch (err) {
      console.error('Backtest failed:', err);
    } finally {
      setRunning(false);
    }
  };

  // Replay controls
  const startReplay = useCallback(() => {
    if (candles.length === 0) return;
    setReplayMode(true);
    setReplayPlaying(true);
    setReplayIndex(0);
  }, [candles.length]);

  const stopReplay = useCallback(() => {
    setReplayPlaying(false);
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, []);

  const resetReplay = useCallback(() => {
    stopReplay();
    setReplayMode(false);
    setReplayIndex(0);
  }, [stopReplay]);

  // Replay timer
  useEffect(() => {
    if (replayPlaying && replayMode) {
      const interval = Math.max(50, 500 / replaySpeed);
      replayTimerRef.current = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= candles.length - 1) {
            stopReplay();
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }
    return () => {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
        replayTimerRef.current = null;
      }
    };
  }, [replayPlaying, replayMode, replaySpeed, candles.length, stopReplay]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-[#787b86]">Loading session...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-white">{session?.name || 'Backtest'}</h1>
            <div className="flex items-center gap-3 text-xs text-[#787b86]">
              <span>{session?.symbol}</span>
              <span>·</span>
              <span>{session?.timeframe}</span>
              <span>·</span>
              <span>${session?.startBalance.toLocaleString()}</span>
              {session?.status === 'completed' && (
                <>
                  <span>·</span>
                  <span className={session.totalPnl && session.totalPnl >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
                    {session.totalPnl && session.totalPnl >= 0 ? '+' : ''}{session.totalPnl?.toFixed(2)} ({session.totalPnlPct?.toFixed(2)}%)
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => loadData(500)} className="btn btn-ghost text-xs">
              Load Data
            </button>
            <button onClick={runBacktest} disabled={running} className="btn btn-success text-xs">
              <Zap size={12} />
              {running ? 'Running...' : 'Run Backtest'}
            </button>
          </div>
        </div>

        {/* Chart + Controls */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Chart area */}
          <div className="xl:col-span-3">
            <div className="card p-0 overflow-hidden">
              {/* Chart toolbar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#2B2B43]">
                <div className="flex items-center gap-1">
                  {/* Replay controls */}
                  {!replayMode ? (
                    <button onClick={startReplay} className="btn btn-ghost !p-1.5" title="Start Replay">
                      <Play size={14} />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setReplayPlaying(!replayPlaying)} className="btn btn-ghost !p-1.5">
                        {replayPlaying ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button onClick={stopReplay} className="btn btn-ghost !p-1.5">
                        <Square size={14} />
                      </button>
                      <button onClick={resetReplay} className="btn btn-ghost !p-1.5">
                        <RotateCcw size={14} />
                      </button>
                      <div className="w-px h-4 bg-[#2B2B43] mx-1" />
                      <select
                        value={replaySpeed}
                        onChange={e => setReplaySpeed(Number(e.target.value))}
                        className="!py-0.5 !px-1.5 !text-xs"
                      >
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={5}>5x</option>
                        <option value={10}>10x</option>
                      </select>
                      {replayMode && (
                        <span className="text-xs text-[#787b86] ml-2">
                          {replayIndex + 1} / {candles.length}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowIndicatorPanel(!showIndicatorPanel)}
                    className={`btn !p-1.5 ${showIndicatorPanel ? 'btn-primary' : 'btn-ghost'}`}
                    title="Indicators"
                  >
                    <Activity size={14} />
                  </button>
                </div>
              </div>

              {/* Indicator panel */}
              {showIndicatorPanel && (
                <div className="px-3 py-2 border-b border-[#2B2B43] bg-[#1e222d]">
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-xs text-[#787b86]">
                      <input
                        type="checkbox"
                        checked={indicators.sma.includes(20)}
                        onChange={e => {
                          setIndicators(prev => ({
                            ...prev,
                            sma: e.target.checked ? [...prev.sma, 20] : prev.sma.filter(p => p !== 20)
                          }));
                        }}
                        className="accent-[#2962ff]"
                      />
                      SMA 20
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#787b86]">
                      <input
                        type="checkbox"
                        checked={indicators.sma.includes(50)}
                        onChange={e => {
                          setIndicators(prev => ({
                            ...prev,
                            sma: e.target.checked ? [...prev.sma, 50] : prev.sma.filter(p => p !== 50)
                          }));
                        }}
                        className="accent-[#2962ff]"
                      />
                      SMA 50
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#787b86]">
                      <input
                        type="checkbox"
                        checked={indicators.ema.includes(12)}
                        onChange={e => {
                          setIndicators(prev => ({
                            ...prev,
                            ema: e.target.checked ? [...prev.ema, 12] : prev.ema.filter(p => p !== 12)
                          }));
                        }}
                        className="accent-[#2962ff]"
                      />
                      EMA 12
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#787b86]">
                      <input
                        type="checkbox"
                        checked={indicators.bollinger}
                        onChange={e => setIndicators(prev => ({ ...prev, bollinger: e.target.checked }))}
                        className="accent-[#2962ff]"
                      />
                      Bollinger Bands
                    </label>
                  </div>
                </div>
              )}

              {/* Chart */}
              <TradingChart
                candles={candles}
                trades={trades}
                indicators={indicators}
                replayMode={replayMode}
                replayIndex={replayIndex}
                height={500}
              />

              {/* Replay progress bar */}
              {replayMode && (
                <div className="px-3 py-2 border-t border-[#2B2B43]">
                  <div className="h-1 bg-[#2B2B43] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2962ff] transition-all duration-100"
                      style={{ width: `${((replayIndex + 1) / candles.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side panel */}
          <div className="xl:col-span-1 space-y-4">
            {/* Strategy config */}
            <div className="card">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Settings size={14} />
                Strategy
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[#787b86]">Fast MA</label>
                    <input
                      type="number"
                      value={strategyConfig.fastPeriod}
                      onChange={e => setStrategyConfig(p => ({ ...p, fastPeriod: Number(e.target.value) }))}
                      className="w-full !text-xs"
                      min={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#787b86]">Slow MA</label>
                    <input
                      type="number"
                      value={strategyConfig.slowPeriod}
                      onChange={e => setStrategyConfig(p => ({ ...p, slowPeriod: Number(e.target.value) }))}
                      className="w-full !text-xs"
                      min={5}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[#787b86]">SL %</label>
                    <input
                      type="number"
                      value={strategyConfig.stopLossPct}
                      onChange={e => setStrategyConfig(p => ({ ...p, stopLossPct: Number(e.target.value) }))}
                      className="w-full !text-xs"
                      min={0.1}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#787b86]">TP %</label>
                    <input
                      type="number"
                      value={strategyConfig.takeProfitPct}
                      onChange={e => setStrategyConfig(p => ({ ...p, takeProfitPct: Number(e.target.value) }))}
                      className="w-full !text-xs"
                      min={0.1}
                      step={0.5}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-[#787b86]">
                  <input
                    type="checkbox"
                    checked={strategyConfig.useRSI}
                    onChange={e => setStrategyConfig(p => ({ ...p, useRSI: e.target.checked }))}
                    className="accent-[#2962ff]"
                  />
                  Use RSI Filter
                </label>
              </div>
            </div>

            {/* Quick stats */}
            {results && (
              <div className="card">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <BarChart3 size={14} />
                  Results
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#787b86]">Total P&L</span>
                    <span className={results.totalPnl >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
                      {results.totalPnl >= 0 ? '+' : ''}{results.totalPnl.toFixed(2)} ({results.totalPnlPct.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#787b86]">Win Rate</span>
                    <span className="text-white">{results.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#787b86]">Trades</span>
                    <span className="text-white">{results.totalTrades}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#787b86]">Max Drawdown</span>
                    <span className="text-[#ef5350]">{results.maxDrawdown.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#787b86]">Sharpe Ratio</span>
                    <span className="text-white">{results.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#787b86]">Profit Factor</span>
                    <span className="text-white">{results.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#787b86]">End Balance</span>
                    <span className="text-white">${results.endBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Data status */}
            <div className="card">
              <h3 className="text-sm font-medium text-white mb-2">Data</h3>
              <div className="text-xs text-[#787b86] space-y-1">
                <div className="flex justify-between">
                  <span>Candles loaded</span>
                  <span className="text-white">{candles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={session?.status === 'completed' ? 'text-[#26a69a]' : 'text-[#ff9800]'}>
                    {session?.status || 'draft'}
                  </span>
                </div>
              </div>
              {candles.length === 0 && (
                <button onClick={() => loadData(500)} className="btn btn-primary w-full mt-3 text-xs">
                  Load 500 Candles
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Results / Trades */}
        {(results || trades.length > 0) && (
          <div className="mt-6">
            <div className="flex items-center gap-1 border-b border-[#2B2B43] mb-4">
              {(['results', 'trades'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm transition-colors ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-[#2962ff]'
                      : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  {tab === 'results' ? 'Performance' : `Trades (${trades.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'results' && results && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Net Prol', value: `$${results.totalPnl.toFixed(2)}`, color: results.totalPnl >= 0 ? '#26a69a' : '#ef5350' },
                  { label: 'Win Rate', value: `${results.winRate.toFixed(1)}%`, color: '#2962ff' },
                  { label: 'Max Drawdown', value: `${results.maxDrawdown.toFixed(2)}%`, color: '#ef5350' },
                  { label: 'Sharpe Ratio', value: results.sharpeRatio.toFixed(2), color: '#ff9800' },
                  { label: 'Profit Factor', value: results.profitFactor.toFixed(2), color: '#9c27b0' },
                  { label: 'Total Trades', value: results.totalTrades.toString(), color: '#d1d4dc' },
                  { label: 'Avg Win', value: `$${results.avgWin.toFixed(2)}`, color: '#26a69a' },
                  { label: 'Avg Loss', value: `$${results.avgLoss.toFixed(2)}`, color: '#ef5350' },
                ].map((stat, i) => (
                  <div key={i} className="card">
                    <div className="text-xs text-[#787b86] mb-1">{stat.label}</div>
                    <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'trades' && (
              <div className="card overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#787b86] border-b border-[#2B2B43]">
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-right py-2 px-3">Entry</th>
                      <th className="text-right py-2 px-3">Exit</th>
                      <th className="text-right py-2 px-3">Qty</th>
                      <th className="text-right py-2 px-3">P&L</th>
                      <th className="text-right py-2 px-3">P&L %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr key={trade.id} className="border-b border-[#2B2B43]/50 hover:bg-[#1e222d]">
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            trade.type === 'long' ? 'bg-[#26a69a]/10 text-[#26a69a]' : 'bg-[#ef5350]/10 text-[#ef5350]'
                          }`}>
                            {trade.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-right py-2 px-3 text-white">{trade.entryPrice.toFixed(5)}</td>
                        <td className="text-right py-2 px-3 text-white">{trade.exitPrice?.toFixed(5) || '-'}</td>
                        <td className="text-right py-2 px-3 text-white">{trade.quantity}</td>
                        <td className={`text-right py-2 px-3 font-medium ${(trade.pnl || 0) >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)}
                        </td>
                        <td className={`text-right py-2 px-3 ${(trade.pnlPct || 0) >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                          {(trade.pnlPct || 0) >= 0 ? '+' : ''}{trade.pnlPct?.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
