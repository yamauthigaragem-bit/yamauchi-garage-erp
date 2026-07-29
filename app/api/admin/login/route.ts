import { NextResponse } from 'next/server';
import { COOKIE_NAME, cookieOptions, createToken } from '../_auth';

export async function POST(request: Request) {
  const configuredEmail = (process.env.ADMIN_EMAIL || 'yamauthigaragem@gmail.com').trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || '';
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || '';

  if (!configuredPassword || configuredPassword.length < 8 || !sessionSecret) {
    return NextResponse.json({ message: 'O acesso administrativo ainda não foi configurado na Vercel.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (email !== configuredEmail || password !== configuredPassword) {
    return NextResponse.json({ message: 'E-mail ou senha administrativa incorretos.' }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(COOKIE_NAME, createToken(email), cookieOptions);
  return response;
}
