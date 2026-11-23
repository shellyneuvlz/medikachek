import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medikacheck-jwt-secret-key-2026-secure';

export interface TokenPayload {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export function generateToken(payload: TokenPayload, rememberMe: boolean = false): string {
  // 30 days if rememberMe, otherwise 24 hours
  const expiresIn = rememberMe ? '30d' : '24h';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
