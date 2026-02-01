import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'waivers.db');

// Ensure database file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
}

const db = new Database(dbPath);

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
initDatabase();

export default db;
