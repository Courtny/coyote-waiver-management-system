import { pool } from './db';

export type WaiverConfidence = 'email_match' | 'phone_match' | 'name_fuzzy' | 'not_found';

export type WaiverRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  yearOfBirth: string;
  signatureDate: string;
  waiverYear: number;
};

function mapRow(row: Record<string, unknown>): WaiverRow {
  return {
    id: row.id as number,
    firstName: (row.firstName as string) || '',
    lastName: (row.lastName as string) || '',
    email: (row.email as string) || '',
    phone: row.phone != null ? String(row.phone) : null,
    yearOfBirth: (row.yearOfBirth as string) || '',
    signatureDate: (row.signatureDate as string) || '',
    waiverYear: Number(row.waiverYear) || 0,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function findWaiversByEmail(email: string): Promise<WaiverRow[]> {
  const e = normalizeEmail(email);
  if (!e) return [];
  const result = await pool.query(
    `SELECT id,
      firstname as "firstName",
      lastname as "lastName",
      email,
      phone,
      yearofbirth as "yearOfBirth",
      signaturedate as "signatureDate",
      waiveryear as "waiverYear"
    FROM waivers
    WHERE LOWER(TRIM(email)) = $1
    ORDER BY waiveryear DESC, signaturedate DESC`,
    [e]
  );
  return result.rows.map((r) => mapRow(r as Record<string, unknown>));
}

export async function findWaiversByPhone(phone: string): Promise<WaiverRow[]> {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 7) return [];
  const result = await pool.query(
    `SELECT id,
      firstname as "firstName",
      lastname as "lastName",
      email,
      phone,
      yearofbirth as "yearOfBirth",
      signaturedate as "signatureDate",
      waiveryear as "waiverYear"
    FROM waivers
    WHERE REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1
    ORDER BY waiveryear DESC, signaturedate DESC`,
    [digits]
  );
  return result.rows.map((r) => mapRow(r as Record<string, unknown>));
}

export async function findWaiversByNameFuzzy(fullName: string, limit = 8): Promise<
  Array<WaiverRow & { relevance: number }>
> {
  const q = fullName.trim();
  if (q.length < 2) return [];
  const searchTerm = `%${q}%`;

  const result = await pool.query(
    `SELECT 
      id,
      firstname as "firstName",
      lastname as "lastName",
      email,
      phone,
      yearofbirth as "yearOfBirth",
      signaturedate as "signatureDate",
      waiveryear as "waiverYear",
      GREATEST(
        COALESCE(similarity(firstname, $1), 0),
        COALESCE(similarity(lastname, $1), 0),
        COALESCE(similarity(firstname || ' ' || lastname, $1), 0)
      ) as relevance
    FROM waivers
    WHERE 
      similarity(firstname, $1) > 0.25 OR
      similarity(lastname, $1) > 0.25 OR
      similarity(firstname || ' ' || lastname, $1) > 0.25 OR
      (firstname || ' ' || lastname) ILIKE $2
    ORDER BY relevance DESC, waiveryear DESC, signaturedate DESC
    LIMIT $3`,
    [q, searchTerm, limit]
  );

  return result.rows.map((r) => ({
    ...mapRow(r as Record<string, unknown>),
    relevance: Number((r as { relevance?: number }).relevance) || 0,
  }));
}

export function pickBestWaiverYear(rows: WaiverRow[], currentYear: number): WaiverRow | null {
  if (rows.length === 0) return null;
  const current = rows.find((r) => r.waiverYear === currentYear);
  if (current) return current;
  return rows[0];
}
