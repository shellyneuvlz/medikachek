import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/jwt.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi tidak valid: Token tidak ditemukan' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Try custom JWT verification first
  const decoded = verifyToken(token);
  if (decoded) {
    // Check if user is still active in database
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (existingUser.length === 0 || !existingUser[0].isActive) {
        return res.status(403).json({ error: 'Akun Anda dinonaktifkan atau tidak ditemukan' });
      }

      req.user = {
        id: existingUser[0].id,
        uid: existingUser[0].uid,
        email: existingUser[0].email,
        name: existingUser[0].name,
        role: existingUser[0].role as 'ADMIN' | 'USER',
      };
      return next();
    } catch (err) {
      console.error('Error verifying user status:', err);
      req.user = decoded;
      return next();
    }
  }

  // Try Firebase ID Token verification
  try {
    const firebaseDecoded = await adminAuth.verifyIdToken(token);
    // Find or create in users table
    let dbUser = await db
      .select()
      .from(users)
      .where(eq(users.uid, firebaseDecoded.uid))
      .limit(1);

    if (dbUser.length === 0) {
      // Auto-insert user from Google Sign In
      const inserted = await db
        .insert(users)
        .values({
          uid: firebaseDecoded.uid,
          email: firebaseDecoded.email || `${firebaseDecoded.uid}@google.user`,
          name: firebaseDecoded.name || 'Pengguna Google',
          role: 'USER',
          isActive: true,
          avatar: firebaseDecoded.picture || null,
        })
        .returning();
      dbUser = inserted;
    }

    if (!dbUser[0].isActive) {
      return res.status(403).json({ error: 'Akun Anda dinonaktifkan oleh administrator' });
    }

    req.user = {
      id: dbUser[0].id,
      uid: dbUser[0].uid,
      email: dbUser[0].email,
      name: dbUser[0].name,
      role: dbUser[0].role as 'ADMIN' | 'USER',
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Sesi telah berakhir atau token tidak valid. Silakan login kembali.' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autentikasi diperlukan' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya administrator yang dapat mengakses halaman ini' });
  }

  next();
};
