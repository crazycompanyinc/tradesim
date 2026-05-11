'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/Layout';
import { ArrowLeft } from 'lucide-react';
import type { MarketSymbol } from '@/types';

export default function NewSessionPage() {
  const router = useRouter();
  const [symbols, setSymbols] = useState<MarketSymbol[]>([]);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1H');
  const [startBalance, setStartBalance] = useState('10000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/market/symbols')
      .then(r => r.json())
      .then(d => { if (d.success) setSymbols(d.data); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name || `${symbol} Backtest`,
          symbol,
          timeframe,
          startBalance: parseFloat(startBalance) || 10000,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/backtest/${data.data.id}`);
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#787b86] hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} />
          Back
        </button>

        <h1 className="text-xl font-bold text-white mb-6">New Backtest Session</h1>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="bg-[#ef5350]/10 border border-[#ef5350]/20 text-[#ef5350] text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-[#787b86] mb-1.5">Session Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. EURUSD MA Crossover"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-[#787b86] mb-1.5">Symbol</label>
            <select value={symbol} onChange={e => setSymbol(e.target.value)} className="w-full">
              {symbols.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#787b86] mb-1.5">Timeframe</label>
            <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="w-full">
              <option value="1H">1 Hour</option>
              <option value="4H">4 Hours</option>
              <option value="1D">1 Day</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#787b86] mb-1.5">Starting Balance ($)</label>
            <input
              type="number"
              value={startBalance}
              onChange={e => setStartBalance(e.target.value)}
              min="100"
              step="1000"
              className="w-full"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center !py-2.5">
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
