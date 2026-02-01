import { sql } from '@vercel/postgres';

// Initialize database schema
export async function initDatabase() {
  try {
    // Waivers table
    await sql`
      CREATE TABLE IF NOT EXISTS waivers (
        id SERIAL PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL,
        yearOfBirth TEXT NOT NULL,
        phone TEXT,
        emergencyContactPhone TEXT NOT NULL,
        safetyRulesInitial TEXT NOT NULL,
        medicalConsentInitial TEXT NOT NULL,
        photoRelease BOOLEAN NOT NULL DEFAULT false,
        minorNames TEXT,
        signature TEXT NOT NULL,
        signatureDate TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        waiverYear INTEGER NOT NULL
      )
    `;

    // Admin users table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for faster searches
    await sql`
      CREATE INDEX IF NOT EXISTS idx_waiver_name ON waivers(lastName, firstName)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_waiver_year ON waivers(waiverYear)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_waiver_minors ON waivers(minorNames)
    `;
  } catch (error) {
    // If tables already exist, that's fine
    if (error instanceof Error && !error.message.includes('already exists')) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }
}

// Initialize database on module load
initDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
});

// Export sql for use in other modules
export { sql };
export default sql;
