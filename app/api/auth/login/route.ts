import { NextRequest, NextResponse } from 'next/server';
import { createToken, getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Stateless auth: create user ID from email hash
    const id = 'usr_' + Buffer.from(email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
    const username = email.split('@')[0];

    const token = await createToken({ id, email, username, role: 'user' });

    return NextResponse.json({
      success: true,
      data: { user: { id, email, username, role: 'user' }, token },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  return NextResponse.json({
    success: true,
    data: { id: payload.id, email: payload.email, username: payload.username, role: payload.role },
  });
}
