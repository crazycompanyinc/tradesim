import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';
import { createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password } = body;

    if (!email || !username || !password) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = db.users.findByEmail(email);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    const id = generateId('usr');
    db.users.create({ id, email, username, password, role: 'user' });

    const token = await createToken({ id, email, username, role: 'user' });

    return NextResponse.json({
      success: true,
      data: { user: { id, email, username, role: 'user' }, token },
    }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
