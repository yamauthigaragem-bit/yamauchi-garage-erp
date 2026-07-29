import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'yamauchi_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || '';
}

export function createToken(email: string) {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${email.toLowerCase()}|${expires}`;
  const signature = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}|${signature}`;
}

export function validateToken(token?: string) {
  if (!token || !secret()) return false;
  const [email, expiresText, signature] = token.split('|');
  if (!email || !expiresText || !signature) return false;
  const expires = Number(expiresText);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', secret()).update(`${email}|${expires}`).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};
