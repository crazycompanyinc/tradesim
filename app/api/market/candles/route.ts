import { NextRequest, NextResponse } from 'next/server';
import { generateCandles } from '@/lib/ohlcv';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const count = parseInt(searchParams.get('count') || '500');
  if (!symbol) return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
  const candles = generateCandles(symbol, count);
  return NextResponse.json({ success: true, data: candles });
}
