import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { generateCandles } from '@/lib/ohlcv';

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
  const candles = db.sessions.getCandles(id);
  return NextResponse.json({ success: true, data: candles });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const session = db.sessions.findById(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }
  const body = await req.json();
  const count = body.count || 500;
  const candles = generateCandles(session.symbol, count);
  db.sessions.setCandles(id, candles);
  return NextResponse.json({ success: true, data: { loaded: candles.length } });
}
