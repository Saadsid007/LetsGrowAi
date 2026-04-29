import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Clear ALL auth cookies — both our custom JWT and NextAuth's session
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  };

  res.setHeader('Set-Cookie', [
    serialize('auth_token', '', cookieOptions),
    serialize('next-auth.session-token', '', cookieOptions),
    serialize('next-auth.callback-url', '', { ...cookieOptions, httpOnly: false }),
    serialize('next-auth.csrf-token', '', { ...cookieOptions, httpOnly: false }),
    serialize('__Secure-next-auth.session-token', '', cookieOptions),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}
