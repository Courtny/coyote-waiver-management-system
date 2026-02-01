import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// On Vercel/serverless, use /tmp directory which is writable
// Otherwise use the project directory
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const dbPath = isVercel 
  ? '/tmp/waivers.db'
  : path.join(process.cwd(), 'waivers.db');

// Log database path for debugging
console.log('Database path:', dbPath);
console.log('Vercel env vars:', {
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  NODE_ENV: process.env.NODE_ENV
});

// Ensure database file exists
try {
  if (!fs.existsSync(dbPath)) {
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, '');
  }
} catch (error) {
  console.error('Error creating database file:', error);
  throw error;
}

let db: Database.Database;
try {
  db = new Database(dbPath);
} catch (error) {
  console.error('Error opening database:', error);
  console.error('Database path:', dbPath);
  throw error;
}

// Initialize database schema
export function initDatabase() {
  // Check if old schema exists and migrate if needed
  try {
    const oldTableInfo = db.prepare("PRAGMA table_info(waivers)").all() as Array<{name: string}>;
    const hasOldSchema = oldTableInfo.some(col => col.name === 'dateOfBirth' || col.name === 'emergencyContactName');
    
    if (hasOldSchema) {
      // Migrate old schema to new schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS waivers_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT NOT NULL,
          yearOfBirth TEXT NOT NULL,
          phone TEXT,
          emergencyContactPhone TEXT NOT NULL,
          safetyRulesInitial TEXT NOT NULL,
          medicalConsentInitial TEXT NOT NULL,
          photoRelease INTEGER NOT NULL DEFAULT 0,
          minorNames TEXT,
          signature TEXT NOT NULL,
          signatureDate TEXT NOT NULL,
          ipAddress TEXT,
          userAgent TEXT,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          waiverYear INTEGER NOT NULL
        )
      `);
      
      // Copy data from old table if it exists
      try {
        db.exec(`
          INSERT INTO waivers_new (id, firstName, lastName, email, yearOfBirth, phone, emergencyContactPhone, safetyRulesInitial, medicalConsentInitial, photoRelease, signature, signatureDate, ipAddress, userAgent, createdAt, waiverYear)
          SELECT id, firstName, lastName, email, 
                 substr(dateOfBirth, 1, 4) as yearOfBirth,
                 phone, emergencyContactPhone,
                 '' as safetyRulesInitial,
                 '' as medicalConsentInitial,
                 0 as photoRelease,
                 signature, signatureDate, ipAddress, userAgent, createdAt, waiverYear
          FROM waivers
        `);
        db.exec('DROP TABLE waivers');
        db.exec('ALTER TABLE waivers_new RENAME TO waivers');
      } catch (e) {
        // If migration fails, just drop and recreate
        db.exec('DROP TABLE IF EXISTS waivers');
        db.exec('DROP TABLE IF EXISTS waivers_new');
      }
    }
  } catch (e) {
    // Table doesn't exist yet, will be created below
  }

  // Waivers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS waivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL,
      yearOfBirth TEXT NOT NULL,
      phone TEXT,
      emergencyContactPhone TEXT NOT NULL,
      safetyRulesInitial TEXT NOT NULL,
      medicalConsentInitial TEXT NOT NULL,
      photoRelease INTEGER NOT NULL DEFAULT 0,
      minorNames TEXT,
      signature TEXT NOT NULL,
      signatureDate TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      waiverYear INTEGER NOT NULL
    )
  `);

  // Admin users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create index for faster searches
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_waiver_name ON waivers(lastName, firstName);
    CREATE INDEX IF NOT EXISTS idx_waiver_year ON waivers(waiverYear);
    CREATE INDEX IF NOT EXISTS idx_waiver_minors ON waivers(minorNames);
  `);
}

// Initialize on import
try {
  initDatabase();
} catch (error) {
  console.error('Error initializing database:', error);
  throw error;
}

export default db;
