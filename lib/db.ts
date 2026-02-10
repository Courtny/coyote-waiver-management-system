import { Pool } from 'pg';

// Create connection pool
// Uses DATABASE_URL or POSTGRES_URL from environment variables (Supabase provides this)
let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
const isSupabase = connectionString?.includes('supabase') || connectionString?.includes('pooler.supabase.com');

// For Supabase connections, ensure SSL is properly configured
// Remove conflicting sslmode from connection string and handle in Pool config
if (isSupabase && connectionString) {
  // Remove sslmode parameter (but keep other parameters)
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, (match) => {
    // If it's the first parameter (starts with ?), replace ? with ?
    // If it's a subsequent parameter (starts with &), just remove it
    return match.startsWith('?') ? '?' : '';
  });
  // Clean up any double ? or & characters
  connectionString = connectionString.replace(/\?+/, '?').replace(/&+/g, '&').replace(/\?&/g, '?').replace(/[?&]$/, '');
}

// For Supabase, always use SSL with rejectUnauthorized: false
// For other connections, use SSL in production only
const pool = new Pool({
  connectionString,
  ssl: isSupabase 
    ? { rejectUnauthorized: false } 
    : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
});

// Initialize database schema
export async function initDatabase() {
  try {
    // Enable pg_trgm extension for fuzzy search
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    } catch (error: any) {
      // Extension might already exist or not be available - that's okay
      const errorMessage = error?.message || '';
      const errorCode = (error as any)?.code || '';
      if (
        !errorMessage.includes('already exists') &&
        errorCode !== '42710' && // duplicate_object
        !errorMessage.includes('permission denied')
      ) {
        console.warn('Could not enable pg_trgm extension:', errorMessage);
      }
    }

    // Waivers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS waivers (
        id SERIAL PRIMARY KEY,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        email TEXT NOT NULL,
        "yearOfBirth" TEXT NOT NULL,
        phone TEXT,
        "emergencyContactPhone" TEXT NOT NULL,
        "safetyRulesInitial" TEXT NOT NULL,
        "medicalConsentInitial" TEXT NOT NULL,
        "photoRelease" BOOLEAN NOT NULL DEFAULT false,
        "minorNames" TEXT,
        signature TEXT NOT NULL,
        "signatureDate" TEXT NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "waiverYear" INTEGER NOT NULL
      )
    `);

    // Admin users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for faster searches
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_waiver_name ON waivers(lastName, firstName)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_waiver_year ON waivers(waiverYear)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_waiver_minors ON waivers(minorNames)
    `);
  } catch (error: any) {
    // If tables/indexes already exist, that's fine - ignore those errors
    const errorMessage = error?.message || '';
    const errorCode = (error as any)?.code || '';
    
    // PostgreSQL errors for existing objects
    if (
      errorMessage.includes('already exists') ||
      errorCode === '42P07' || // duplicate_table
      errorCode === '42710' || // duplicate_object
      errorCode === '23505' || // unique_violation (for sequences/indexes)
      errorMessage.includes('duplicate key')
    ) {
      // These are expected - tables/indexes already exist
      return;
    }
    
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize database on module load
initDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
});

// Export pool for use in other modules
export { pool };
export default pool;
