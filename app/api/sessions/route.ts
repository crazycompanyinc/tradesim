import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

async function getUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const sessions = db.sessions.findByUser(user.id);
  return NextResponse.json({ success: true, data: sessions });
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { name, symbol, timeframe, startBalance } = body;
  if (!name || !symbol) {
    return NextResponse.json({ success: false, error: 'Name and symbol required' }, { status: 400 });
  }
  const session = db.sessions.create({
    name, symbol, timeframe: timeframe || '1H',
    startBalance: startBalance || 10000, status: 'draft', userId: user.id,
  });
  return NextResponse.json({ success: true, data: session }, { status: 201 });
}
