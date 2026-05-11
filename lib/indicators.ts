import { Candle, Trade, BacktestResults } from '@/types';

export function calculateSMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    const sum = candles.slice(i - period + 1, i + 1).reduce((s, c) => s + c.close, 0);
    result.push(sum / period);
  }
  return result;
}

export function calculateEMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  let ema: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (ema === null) {
      ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
    } else {
      ema = (candles[i].close - ema) * multiplier + ema;
    }
    result.push(ema);
  }
  return result;
}

export function calculateRSI(candles: Candle[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (candles.length < period + 1) return candles.map(() => null);

  const changes = candles.slice(1).map((c, i) => c.close - candles[i].close);
  let avgGain = changes.slice(0, period).filter(c => c > 0).reduce((s, c) => s + c, 0) / period;
  let avgLoss = Math.abs(changes.slice(0, period).filter(c => c < 0).reduce((s, c) => s + c, 0)) / period;

  result.push(null); // First candle has no change
  for (let i = 0; i < period; i++) result.push(null);

  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  return result;
}

export function calculateBollingerBands(candles: Candle[], period: number = 20, stdDev: number = 2): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const sma = calculateSMA(candles, period);
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
      continue;
    }
    const slice = candles.slice(i - period + 1, i + 1).map(c => c.close);
    const mean = sma[i]!;
    const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    middle.push(mean);
    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }

  return { upper, middle, lower };
}

export function calculateMACD(candles: Candle[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const fastEMA = calculateEMA(candles, fast);
  const slowEMA = calculateEMA(candles, slow);
  const macdLine: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i]! - slowEMA[i]!);
    }
  }

  // Signal line = EMA of MACD
  const validMacd = macdLine.filter(v => v !== null) as number[];
  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  let signalEma: number | null = null;
  const multiplier = 2 / (signal + 1);
  let signalCount = 0;

  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
      histogram.push(null);
      continue;
    }
    signalCount++;
    if (signalCount <= signal) {
      if (signalCount === signal) {
        signalEma = validMacd.slice(0, signal).reduce((s, v) => s + v, 0) / signal;
      }
      signalLine.push(null);
      histogram.push(null);
    } else {
      signalEma = (macdLine[i]! - signalEma!) * multiplier + signalEma!;
      signalLine.push(signalEma);
      histogram.push(macdLine[i]! - signalEma);
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

interface BacktestConfig {
  fastPeriod: number;
  slowPeriod: number;
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
  stopLossPct: number;
  takeProfitPct: number;
  useRSI: boolean;
}

export function runBacktest(
  candles: Candle[],
  startBalance: number,
  config: BacktestConfig
): BacktestResults {
  const smaFast = calculateSMA(candles, config.fastPeriod);
  const smaSlow = calculateSMA(candles, config.slowPeriod);
  const rsi = config.useRSI ? calculateRSI(candles, config.rsiPeriod) : candles.map(() => null);

  let balance = startBalance;
  let position: {
    type: 'long' | 'short';
    entryPrice: number;
    quantity: number;
    stopLoss: number;
    takeProfit: number;
    entryTime: number;
  } | null = null;
  const trades: Trade[] = [];
  const equity: { time: number; value: number }[] = [{ time: candles[0].time, value: startBalance }];
  let peakBalance = startBalance;
  let maxDrawdown = 0;

  for (let i = config.slowPeriod; i < candles.length; i++) {
    const candle = candles[i];
    const fastVal = smaFast[i];
    const slowVal = smaSlow[i];
    const prevFast = smaFast[i - 1];
    const prevSlow = smaSlow[i - 1];
    const rsiVal = rsi[i];

    if (fastVal === null || slowVal === null || prevFast === null || prevSlow === null) {
      equity.push({ time: candle.time, value: balance });
      continue;
    }

    // Check exit
    if (position) {
      let exitPrice: number | null = null;
      if (position.type === 'long') {
        if (position.stopLoss && candle.low <= position.stopLoss) exitPrice = position.stopLoss;
        else if (position.takeProfit && candle.high >= position.takeProfit) exitPrice = position.takeProfit;
      } else {
        if (position.stopLoss && candle.high >= position.stopLoss) exitPrice = position.stopLoss;
        else if (position.takeProfit && candle.low <= position.takeProfit) exitPrice = position.takeProfit;
      }

      if (exitPrice) {
        const pnl = position.type === 'long'
          ? (exitPrice - position.entryPrice) * position.quantity
          : (position.entryPrice - exitPrice) * position.quantity;
        balance += pnl;
        trades.push({
          id: `trd_${i}_${Date.now()}`,
          sessionId: '',
          type: position.type,
          entryPrice: position.entryPrice,
          exitPrice,
          entryTime: new Date(position.entryTime * 1000).toISOString(),
          exitTime: new Date(candle.time * 1000).toISOString(),
          quantity: position.quantity,
          stopLoss: position.stopLoss,
          takeProfit: position.takeProfit,
          pnl,
          pnlPct: (pnl / balance) * 100,
          status: 'closed',
          notes: null,
        });
        position = null;
      }
    }

    // Check entry
    if (!position) {
      const longSignal = prevFast <= prevSlow && fastVal > slowVal;
      const shortSignal = prevFast >= prevSlow && fastVal < slowVal;
      let newType: 'long' | 'short' | null = null;

      if (config.useRSI && rsiVal !== null) {
        if (longSignal && rsiVal < config.rsiOversold) newType = 'long';
        else if (shortSignal && rsiVal > config.rsiOverbought) newType = 'short';
      } else {
        if (longSignal) newType = 'long';
        else if (shortSignal) newType = 'short';
      }

      if (newType) {
        const slPct = config.stopLossPct / 100;
        const tpPct = config.takeProfitPct / 100;
        position = {
          type: newType,
          entryPrice: candle.open,
          quantity: 1,
          stopLoss: newType === 'long' ? candle.open * (1 - slPct) : candle.open * (1 + slPct),
          takeProfit: newType === 'long' ? candle.open * (1 + tpPct) : candle.open * (1 - tpPct),
          entryTime: candle.time,
        };
      }
    }

    // Track equity and drawdown
    if (balance > peakBalance) peakBalance = balance;
    const dd = peakBalance > 0 ? ((peakBalance - balance) / peakBalance) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
    equity.push({ time: candle.time, value: balance });
  }

  // Calculate stats
  const winningTrades = trades.filter(t => t.pnl! > 0);
  const losingTrades = trades.filter(t => t.pnl! < 0);
  const totalPnl = balance - startBalance;
  const grossWin = winningTrades.reduce((s, t) => s + t.pnl!, 0);
  const grossLoss = Math.abs(losingTrades.reduce((s, t) => s + t.pnl!, 0));

  // Sharpe ratio (simplified)
  const returns = equity.slice(1).map((e, i) => (e.value - equity[i].value) / equity[i].value);
  const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  return {
    session: null as any,
    trades,
    summary: {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalPnl,
      totalPnlPct: (totalPnl / startBalance) * 100,
      startBalance,
      endBalance: balance,
      maxDrawdown,
      sharpeRatio,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0,
      avgWin: winningTrades.length > 0 ? grossWin / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? grossLoss / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl!)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl!)) : 0,
    },
    equity,
  };
}
