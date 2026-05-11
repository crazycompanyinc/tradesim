import { Candle, BacktestSession, Trade, User } from '@/types';

// In-memory store for Vercel serverless compatibility
// Data persists within a single serverless instance's lifetime
const store = {
  users: [] as (User & { password: string })[],
  sessions: [] as (BacktestSession & { candles: Candle[]; trades: Trade[] })[],
};

// Seed demo user
const demoPw = '$2a$10$LJ3m4yS8xGKz0VQvK3L5/.LJ3m4yS8xGKz0VQvK3L5/LJ3m4yS8xG';
store.users.push({
  id: 'usr_demo_001',
  email: 'demo@tradesim.com',
  username: 'demo',
  password: demoPw,
  role: 'user',
  createdAt: new Date().toISOString(),
});

export const db = {
  users: {
    findByEmail(email: string) {
      return store.users.find(u => u.email === email) || null;
    },
    findById(id: string) {
      return store.users.find(u => u.id === id) || null;
    },
    create(user: Omit<User, 'createdAt'> & { password: string }) {
      const newUser = { ...user, createdAt: new Date().toISOString() };
      store.users.push(newUser);
      return newUser;
    },
  },
  sessions: {
    findByUser(userId: string) {
      return store.sessions
        .filter(s => s.userId === userId)
        .map(({ candles: _c, trades: _t, ...s }) => s)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    findById(id: string) {
      return store.sessions.find(s => s.id === id) || null;
    },
    create(session: Omit<BacktestSession, 'id' | 'createdAt' | 'updatedAt' | 'endBalance' | 'totalPnl' | 'totalPnlPct' | 'totalTrades' | 'winningTrades' | 'losingTrades' | 'winRate' | 'maxDrawdown' | 'sharpeRatio' | 'profitFactor'> & { userId: string }) {
      const newSession: BacktestSession & { candles: Candle[]; trades: Trade[] } = {
        ...session,
        id: 'sess_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        endBalance: null,
        totalPnl: null,
        totalPnlPct: null,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: null,
        maxDrawdown: null,
        sharpeRatio: null,
        profitFactor: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        candles: [],
        trades: [],
      };
      store.sessions.push(newSession);
      return newSession;
    },
    delete(id: string) {
      const idx = store.sessions.findIndex(s => s.id === id);
      if (idx >= 0) store.sessions.splice(idx, 1);
    },
    getCandles(sessionId: string) {
      const s = store.sessions.find(s => s.id === sessionId);
      return s?.candles || [];
    },
    setCandles(sessionId: string, candles: Candle[]) {
      const s = store.sessions.find(s => s.id === sessionId);
      if (s) s.candles = candles;
    },
    getTrades(sessionId: string) {
      const s = store.sessions.find(s => s.id === sessionId);
      return s?.trades || [];
    },
    addTrade(sessionId: string, trade: Omit<Trade, 'id'>) {
      const s = store.sessions.find(s => s.id === sessionId);
      if (!s) return null;
      const newTrade: Trade = {
        ...trade,
        id: 'trd_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      };
      s.trades.push(newTrade);
      return newTrade;
    },
    updateSession(sessionId: string, updates: Partial<BacktestSession>) {
      const s = store.sessions.find(s => s.id === sessionId);
      if (s) {
        Object.assign(s, updates, { updatedAt: new Date().toISOString() });
      }
    },
    clearTrades(sessionId: string) {
      const s = store.sessions.find(s => s.id === sessionId);
      if (s) s.trades = [];
    },
  },
};

export function generateId(prefix: string = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
