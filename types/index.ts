export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  sessionId: string;
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice: number | null;
  entryTime: string;
  exitTime: string | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number | null;
  pnlPct: number | null;
  status: 'open' | 'closed';
  notes: string | null;
}

export interface BacktestSession {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  startBalance: number;
  endBalance: number | null;
  totalPnl: number | null;
  totalPnlPct: number | null;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number | null;
  maxDrawdown: number | null;
  sharpeRatio: number | null;
  profitFactor: number | null;
  status: 'draft' | 'running' | 'completed' | 'error';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BacktestResults {
  session: BacktestSession;
  trades: Trade[];
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnl: number;
    totalPnlPct: number;
    startBalance: number;
    endBalance: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
  };
  equity: { time: number; value: number }[];
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface MarketSymbol {
  symbol: string;
  name: string;
  category: string;
}

export interface IndicatorConfig {
  sma?: { period: number; color: string }[];
  ema?: { period: number; color: string }[];
  bollinger?: { period: number; stdDev: number };
  rsi?: { period: number };
  macd?: { fast: number; slow: number; signal: number };
}
