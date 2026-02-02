import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db';

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
  await pool.query(
    'INSERT INTO admin_users (username, passwordhash) VALUES ($1, $2)',
    [username, passwordHash]
  );
}

export async function authenticateAdmin(username: string, password: string): Promise<boolean> {
  try {
    console.log('authenticateAdmin called with username:', username);
    
    // First, check all users in database for debugging
    const allUsersResult = await pool.query('SELECT username FROM admin_users');
    console.log('All users in database:', allUsersResult.rows);
    
    const result = await pool.query(
      'SELECT passwordhash FROM admin_users WHERE username = $1',
      [username]
    );
    
    console.log('Exact match query result:', result.rows.length > 0 ? 'Found' : 'Not found');
    console.log('Result rows:', JSON.stringify(result.rows, null, 2));
    console.log('First row keys:', result.rows.length > 0 ? Object.keys(result.rows[0]) : 'No rows');
    
    if (result.rows.length === 0) {
      // Try case-insensitive search
      const caseInsensitiveResult = await pool.query(
        'SELECT username, passwordhash FROM admin_users WHERE LOWER(username) = LOWER($1)',
        [username]
      );
      
      console.log('Case-insensitive query result:', caseInsensitiveResult.rows.length > 0 ? 'Found' : 'Not found');
      
      if (caseInsensitiveResult.rows.length === 0) {
        console.log('No user found with username:', username);
        return false;
      }
      
      const user = caseInsensitiveResult.rows[0] as any;
      console.log('Found user with case-insensitive match:', user.username);
      console.log('Case-insensitive user object:', JSON.stringify(user, null, 2));
      const passwordHash = user.passwordhash || user.passwordHash;
      console.log('passwordHash from case-insensitive:', passwordHash);
      
      if (!passwordHash) {
        console.error('passwordHash is missing in case-insensitive result!');
        return false;
      }
      
      const isValid = await verifyPassword(password, passwordHash);
      console.log('Password verification result:', isValid);
      return isValid;
    }
    
    const user = result.rows[0] as any;
    console.log('Found user with exact match');
    console.log('User object:', JSON.stringify(user, null, 2));
    console.log('User object keys:', Object.keys(user));
    // PostgreSQL returns lowercase column names for unquoted identifiers
    const passwordHash = user.passwordhash || user.passwordHash;
    console.log('passwordHash value:', passwordHash);
    console.log('passwordHash type:', typeof passwordHash);
    
    if (!passwordHash) {
      console.error('passwordHash is missing or undefined!');
      return false;
    }
    
    const isValid = await verifyPassword(password, passwordHash);
    console.log('Password verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error in authenticateAdmin:', error);
    throw error;
  }
}

export interface AdminUser {
  id: number;
  username: string;
  createdAt: string;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const result = await pool.query(
    'SELECT id, username, createdAt FROM admin_users ORDER BY createdAt DESC'
  );
  return result.rows as AdminUser[];
}

export async function getAdminUserById(id: number): Promise<AdminUser | null> {
  const result = await pool.query(
    'SELECT id, username, createdAt FROM admin_users WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0] as AdminUser;
}

export async function deleteAdminUser(id: number): Promise<void> {
  await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
}
