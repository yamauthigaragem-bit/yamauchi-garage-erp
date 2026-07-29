import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '../_auth';

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
