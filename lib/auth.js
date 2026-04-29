import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import connectDB from './db';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('Please define JWT_SECRET in .env.local');
}

// ─── 1. Generate JWT ──────────────────────────────────────────────────────────
export function generateToken(userId) {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ─── 2. Verify JWT ────────────────────────────────────────────────────────────
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ─── 3. Extract token from Pages Router request (req object) ──────────────────
export function getTokenFromRequest(req) {
  // Check Authorization header: "Bearer <token>"
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check httpOnly cookie
  const cookieHeader = req.headers?.cookie || '';
  const cookies = parseCookies(cookieHeader);
  if (cookies.auth_token) {
    return cookies.auth_token;
  }

  return null;
}

// ─── 4. Get full User document from request ───────────────────────────────────
import { getToken } from 'next-auth/jwt';

export async function getUserFromRequest(req) {
  try {
    let userId = null;

    // First try custom JWT
    const token = getTokenFromRequest(req);
    if (token) {
      const payload = verifyToken(token);
      if (payload?.userId) {
        userId = payload.userId;
      }
    }

    // If no custom token, try NextAuth token
    if (!userId) {
      const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (nextAuthToken?.userId) {
        userId = nextAuthToken.userId;
      }
    }

    if (!userId) return null;

    await connectDB();
    const user = await User.findById(userId).select('-passwordHash -__v');
    return user;
  } catch {
    return null;
  }
}

// ─── 5. Set auth cookie on Pages Router response (res object) ─────────────────
export function setAuthCookie(res, token) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
  };
  res.setHeader('Set-Cookie', serialize('auth_token', token, cookieOptions));
}

// ─── 6. Clear auth cookie (logout) ───────────────────────────────────────────
export function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    serialize('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })
  );
}

// ─── Helper: Simple cookie string parser ─────────────────────────────────────
function parseCookies(cookieString) {
  const cookies = {};
  if (!cookieString) return cookies;
  cookieString.split(';').forEach((cookie) => {
    const [key, ...val] = cookie.trim().split('=');
    if (key) cookies[key.trim()] = decodeURIComponent(val.join('='));
  });
  return cookies;
}
