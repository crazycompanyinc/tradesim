import { Candle } from '@/types';

const SYMBOL_CONFIGS: Record<string, { base: number; volatility: number }> = {
  EURUSD: { base: 1.0850, volatility: 0.0020 },
  GBPUSD: { base: 1.2650, volatility: 0.0025 },
  USDJPY: { base: 150.50, volatility: 0.5 },
  BTCUSD: { base: 42000, volatility: 800 },
  ETHUSD: { base: 2250, volatility: 80 },
  AAPL: { base: 178, volatility: 3 },
  GOOGL: { base: 140, volatility: 2.5 },
  TSLA: { base: 245, volatility: 8 },
  GOLD: { base: 2020, volatility: 20 },
  SILVER: { base: 24.5, volatility: 0.5 },
};

// Seeded random for reproducibility
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateCandles(
  symbol: string,
  count: number = 500,
  timeframeSeconds: number = 3600,
  seed?: number
): Candle[] {
  const config = SYMBOL_CONFIGS[symbol] || { base: 100, volatility: 1 };
  const random = seededRandom(seed || symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0));

  const candles: Candle[] = [];
  let price = config.base;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * timeframeSeconds;

  // Generate with slight trend bias for realism
  let trend = 0;
  for (let i = 0; i < count; i++) {
    // Trend changes slowly
    if (i % 50 === 0) trend = (random() - 0.5) * 0.3;

    const change = (random() - 0.48 + trend * 0.02) * config.volatility;
    const open = price;
    const close = price + change;
    const wickUp = random() * config.volatility * 0.4;
    const wickDown = random() * config.volatility * 0.4;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = Math.floor(random() * 10000) + 500;

    candles.push({
      time: startTime + i * timeframeSeconds,
      open: parseFloat(open.toFixed(symbol.includes('JPY') ? 3 : symbol.includes('USD') && !symbol.startsWith('BTC') && !symbol.startsWith('ETH') ? 5 : 2)),
      high: parseFloat(high.toFixed(symbol.includes('JPY') ? 3 : symbol.includes('USD') && !symbol.startsWith('BTC') && !symbol.startsWith('ETH') ? 5 : 2)),
      low: parseFloat(low.toFixed(symbol.includes('JPY') ? 3 : symbol.includes('USD') && !symbol.startsWith('BTC') && !symbol.startsWith('ETH') ? 5 : 2)),
      close: parseFloat(close.toFixed(symbol.includes('JPY') ? 3 : symbol.includes('USD') && !symbol.startsWith('BTC') && !symbol.startsWith('ETH') ? 5 : 2)),
      volume,
    });

    price = close;
  }

  return candles;
}

export const MARKET_SYMBOLS = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'Forex' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'Forex' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'Forex' },
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'Crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'Crypto' },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'Stocks' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Stocks' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Stocks' },
  { symbol: 'GOLD', name: 'Gold Futures', category: 'Commodities' },
  { symbol: 'SILVER', name: 'Silver Futures', category: 'Commodities' },
];
