import { createHmac } from 'node:crypto';
import { Candle, BacktestSession, Trade, User } from '@/types';

const JWT_SECRET = 'tradesim-jwt-secret-2026';

function base64url(data: string): string {
  return Buffer.from(data).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(data: string): string {
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString();
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export interface JWTPayload {
  id: string;
  email: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = { ...payload, iat: now, exp: now + 7 * 24 * 3600 };
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(fullPayload));
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.${sig}`;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64urlDecode(parts[1])) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/tradesim_token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

// ── In-memory store ──
const store = {
  users: [] as (User & { password: string })[],
  sessions: [] as (BacktestSession & { candles: Candle[]; trades: Trade[] })[],
  seeded: false,
};

function seedStore() {
  if (store.seeded) return;
  store.seeded = true;
  store.users.push({
    id: 'usr_demo_001',
    email: 'demo@tradesim.com',
    username: 'demo',
    password: simpleHash('demo123'),
    role: 'user',
    createdAt: new Date().toISOString(),
  });
}

export const db = {
  users: {
    findByEmail(email: string) {
      seedStore();
      return store.users.find(u => u.email === email) || null;
    },
    findById(id: string) {
      seedStore();
      return store.users.find(u => u.id === id) || null;
    },
    create(user: Omit<User, 'createdAt'> & { password: string }) {
      seedStore();
      const newUser = { ...user, password: simpleHash(user.password), createdAt: new Date().toISOString() };
      store.users.push(newUser);
      return newUser;
    },
  },
  sessions: {
    findByUser(userId: string) {
      seedStore();
      return store.sessions
        .filter(s => s.userId === userId)
        .map(({ candles: _c, trades: _t, ...s }) => s)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    findById(id: string) {
      seedStore();
      return store.sessions.find(s => s.id === id) || null;
    },
    create(session: Omit<BacktestSession, 'id' | 'createdAt' | 'updatedAt' | 'endBalance' | 'totalPnl' | 'totalPnlPct' | 'totalTrades' | 'winningTrades' | 'losingTrades' | 'winRate' | 'maxDrawdown' | 'sharpeRatio' | 'profitFactor'> & { userId: string }) {
      seedStore();
      const ns: BacktestSession & { candles: Candle[]; trades: Trade[] } = {
        ...session,
        id: 'sess_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        endBalance: null, totalPnl: null, totalPnlPct: null,
        totalTrades: 0, winningTrades: 0, losingTrades: 0,
        winRate: null, maxDrawdown: null, sharpeRatio: null, profitFactor: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        candles: [], trades: [],
      };
      store.sessions.push(ns);
      return ns;
    },
    delete(id: string) {
      seedStore();
      const idx = store.sessions.findIndex(s => s.id === id);
      if (idx >= 0) store.sessions.splice(idx, 1);
    },
    getCandles(sessionId: string) {
      seedStore();
      return (store.sessions.find(s => s.id === sessionId)?.candles) || [];
    },
    setCandles(sessionId: string, candles: Candle[]) {
      seedStore();
      const s = store.sessions.find(s => s.id === sessionId);
      if (s) s.candles = candles;
    },
    getTrades(sessionId: string) {
      seedStore();
      return (store.sessions.find(s => s.id === sessionId)?.trades) || [];
    },
    addTrade(sessionId: string, trade: Omit<Trade, 'id'>) {
      seedStore();
      const s = store.sessions.find(s => s.id === sessionId);
      if (!s) return null;
      const nt: Trade = { ...trade, id: 'trd_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7) };
      s.trades.push(nt);
      return nt;
    },
    updateSession(sessionId: string, updates: Partial<BacktestSession>) {
      seedStore();
      const s = store.sessions.find(s => s.id === sessionId);
      if (s) Object.assign(s, updates, { updatedAt: new Date().toISOString() });
    },
    clearTrades(sessionId: string) {
      seedStore();
      const s = store.sessions.find(s => s.id === sessionId);
      if (s) s.trades = [];
    },
  },
};

export function generateId(prefix: string = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
