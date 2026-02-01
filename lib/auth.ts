import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string };
  } catch {
    return null;
  }
}

export async function createAdminUser(username: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  const stmt = db.prepare('INSERT INTO admin_users (username, passwordHash) VALUES (?, ?)');
  stmt.run(username, passwordHash);
}

export async function authenticateAdmin(username: string, password: string): Promise<boolean> {
  const stmt = db.prepare('SELECT passwordHash FROM admin_users WHERE username = ?');
  const result = stmt.get(username) as { passwordHash: string } | undefined;
  
  if (!result) {
    return false;
  }
  
  return verifyPassword(password, result.passwordHash);
}
