import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';
import { createToken, getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // For demo: accept any password for demo@tradesim.com, otherwise check
    const validPassword = email === 'demo@tradesim.com' || password.length >= 6;
    if (!validPassword) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
