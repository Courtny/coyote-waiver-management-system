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
  try {
    console.log('createAdminUser called with username:', username);
    const passwordHash = await hashPassword(password);
    console.log('Password hash generated, length:', passwordHash.length);
    const stmt = db.prepare('INSERT INTO admin_users (username, passwordHash) VALUES (?, ?)');
    const result = stmt.run(username, passwordHash);
    console.log('Admin user inserted, result:', result);
    
    // Verify the user was actually created
    const verifyStmt = db.prepare('SELECT username FROM admin_users WHERE username = ?');
    const verifyResult = verifyStmt.get(username);
    console.log('Verification query result:', verifyResult);
  } catch (error: any) {
    console.error('createAdminUser error:', error);
    console.error('Database error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno
    });
    throw error;
  }
}

export async function authenticateAdmin(username: string, password: string): Promise<boolean> {
  console.log('authenticateAdmin called with username:', username);
  
  // First, check all users in database for debugging
  const allUsersStmt = db.prepare('SELECT username FROM admin_users');
  const allUsers = allUsersStmt.all();
  console.log('All users in database:', allUsers);
  
  const stmt = db.prepare('SELECT passwordHash FROM admin_users WHERE username = ?');
  const result = stmt.get(username) as { passwordHash: string } | undefined;
  
  console.log('User lookup result:', result ? 'Found user' : 'User not found');
  console.log('Username searched:', username);
  console.log('Username type:', typeof username);
  
  if (!result) {
    // Try case-insensitive search
    const caseInsensitiveStmt = db.prepare('SELECT username, passwordHash FROM admin_users WHERE LOWER(username) = LOWER(?)');
    const caseInsensitiveResult = caseInsensitiveStmt.get(username) as { username: string, passwordHash: string } | undefined;
    console.log('Case-insensitive search result:', caseInsensitiveResult);
    if (caseInsensitiveResult) {
      console.log('Found user with different case:', caseInsensitiveResult.username);
      const isValid = await verifyPassword(password, caseInsensitiveResult.passwordHash);
      console.log('Password verification result:', isValid);
      return isValid;
    }
    return false;
  }
  
  const isValid = await verifyPassword(password, result.passwordHash);
  console.log('Password verification result:', isValid);
  return isValid;
}
