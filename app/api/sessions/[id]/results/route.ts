import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

async function getUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const session = db.sessions.findById(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }
  const trades = db.sessions.getTrades(id);
  const { candles: _c, trades: _t, ...s } = session;
  return NextResponse.json({
    success: true,
    data: {
      session: s, trades,
      summary: {
        totalTrades: s.totalTrades, winningTrades: s.winningTrades,
        losingTrades: s.losingTrades, winRate: s.winRate,
        totalPnl: s.totalPnl, startBalance: s.startBalance,
        endBalance: s.endBalance, maxDrawdown: s.maxDrawdown,
        sharpeRatio: s.sharpeRatio, profitFactor: s.profitFactor,
      },
    },
  });
}
