import { NextResponse } from 'next/server';
import { MARKET_SYMBOLS } from '@/lib/ohlcv';

export async function GET() {
  return NextResponse.json({ success: true, data: MARKET_SYMBOLS });
}
