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

    // Ticket check-ins (event gate — per order line unit)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_checkins (
        id SERIAL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "variantId" TEXT NOT NULL DEFAULT '',
        "unitIndex" INTEGER NOT NULL,
        "checkedInAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("productId", "orderId", "variantId", "unitIndex")
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ticket_checkins_product ON ticket_checkins("productId")
    `);

    // Per-product "Show as active" on the event tickets list
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_ticket_active (
        "productId" TEXT PRIMARY KEY,
        "showAsActive" BOOLEAN NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Durable Webflow orders cache (survives serverless cold starts)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webflow_orders_cache (
        "orderId" TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        "acceptedOn" TEXT,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_webflow_orders_cache_accepted
        ON webflow_orders_cache("acceptedOn")
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS webflow_orders_sync_meta (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        "lastSyncAt" TIMESTAMP,
        "lastKnownTotal" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      INSERT INTO webflow_orders_sync_meta (id, "lastKnownTotal")
      VALUES (1, 0)
      ON CONFLICT (id) DO NOTHING
    `);

    // Frozen Past event ticket summaries (not re-aggregated on every list load)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_ticket_summary_cache (
        "productId" TEXT PRIMARY KEY,
        summary JSONB NOT NULL,
        "frozenAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Camping waiver columns (existing CREATE IF NOT EXISTS will not alter live schema)
    await pool.query(`
      ALTER TABLE waivers
      ADD COLUMN IF NOT EXISTS waivertype TEXT NOT NULL DEFAULT 'field'
    `);
    await pool.query(`
      ALTER TABLE waivers
      ADD COLUMN IF NOT EXISTS emergencycontactname TEXT
    `);
    await pool.query(`
      ALTER TABLE waivers
      ADD COLUMN IF NOT EXISTS guardianname TEXT
    `);
    await pool.query(`
      ALTER TABLE waivers
      ADD COLUMN IF NOT EXISTS guardiansignature TEXT
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
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_waiver_type ON waivers(waivertype)
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
