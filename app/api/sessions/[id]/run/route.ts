import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { runBacktest } from '@/lib/indicators';

async function getUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const session = db.sessions.findById(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }
  const candles = db.sessions.getCandles(id);
  if (candles.length < 50) {
    return NextResponse.json({ success: false, error: 'Need at least 50 candles. Load data first.' }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const config = {
    fastPeriod: body.fastPeriod || 10,
    slowPeriod: body.slowPeriod || 30,
    rsiPeriod: body.rsiPeriod || 14,
    rsiOversold: body.rsiOversold || 30,
    rsiOverbought: body.rsiOverbought || 70,
    stopLossPct: body.stopLossPct || 2,
    takeProfitPct: body.takeProfitPct || 4,
    useRSI: body.useRSI || false,
  };
  const results = runBacktest(candles, session.startBalance, config);
  db.sessions.clearTrades(id);
  for (const trade of results.trades) {
    db.sessions.addTrade(id, { ...trade, sessionId: id });
  }
  db.sessions.updateSession(id, {
    status: 'completed',
    endBalance: results.summary.endBalance,
    totalPnl: results.summary.totalPnl,
    totalPnlPct: results.summary.totalPnlPct,
    totalTrades: results.summary.totalTrades,
    winningTrades: results.summary.winningTrades,
    losingTrades: results.summary.losingTrades,
    winRate: results.summary.winRate,
    maxDrawdown: results.summary.maxDrawdown,
    sharpeRatio: results.summary.sharpeRatio,
    profitFactor: results.summary.profitFactor,
  });
  return NextResponse.json({ success: true, data: results });
}
