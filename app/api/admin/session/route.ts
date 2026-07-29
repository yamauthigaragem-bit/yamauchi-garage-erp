import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE_NAME, validateToken } from '../_auth';

export async function GET() {
  const cookieStore = await cookies();
  const authenticated = validateToken(cookieStore.get(COOKIE_NAME)?.value);
  return NextResponse.json({ authenticated });
}
