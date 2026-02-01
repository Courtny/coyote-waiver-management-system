import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from './db';

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
  await sql`
    INSERT INTO admin_users (username, passwordHash)
    VALUES (${username}, ${passwordHash})
  `;
}

export async function authenticateAdmin(username: string, password: string): Promise<boolean> {
  const result = await sql`
    SELECT passwordHash FROM admin_users WHERE username = ${username}
  `;
  
  if (result.rows.length === 0) {
    // Try case-insensitive search
    const caseInsensitiveResult = await sql`
      SELECT username, passwordHash FROM admin_users WHERE LOWER(username) = LOWER(${username})
    `;
    
    if (caseInsensitiveResult.rows.length === 0) {
      return false;
    }
    
    const user = caseInsensitiveResult.rows[0] as { passwordHash: string };
    return verifyPassword(password, user.passwordHash);
  }
  
  const user = result.rows[0] as { passwordHash: string };
  return verifyPassword(password, user.passwordHash);
}
