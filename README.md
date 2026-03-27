# Coyote Force Waiver Management System

Waiver management system for Coyote Force Airsoft and Paintball. Players submit waivers online; admins can search and verify submissions.

## Features

- **Waiver Submission**: Personal info, emergency contact, electronic signature, photo release, minor tracking
- **Admin Dashboard**: Fuzzy search with typeahead, waiver status validation, admin user management
- **Check-In** (`/admin/checkin`): Person-first lookup — current-year waiver status plus Webflow ecommerce orders (cached)
- **Ticket counts** (`/admin/tickets`): Tickets sold per product/SKU and a drill-down table by customer (same Webflow cache)
- **Variant images**: When Webflow order line items include `variantImage`, thumbnails appear on Check-In purchases and Ticket counts (no extra env vars)
- **Security**: JWT authentication, bcrypt password hashing

## Tech Stack

- Next.js 14, TypeScript, Tailwind CSS
- PostgreSQL (Supabase), `pg`
- JWT, bcryptjs
- Webflow Data API v2 (ecommerce orders) via server-side fetch
- Lucide React (icons), date-fns
- @vercel/analytics

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Create `.env` or `.env.local` (see [`.env.example`](./.env.example) for all keys):
```bash
cp .env.example .env.local
# Edit .env.local: set JWT_SECRET, DATABASE_URL, and optionally Webflow vars below.
```

Minimal local setup:
```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env.local
echo "NODE_ENV=development" >> .env.local
```

Add your database URL:
```
DATABASE_URL=your-supabase-connection-string
```

**Webflow (check-in purchases):** add `WEBFLOW_API_TOKEN` and `WEBFLOW_SITE_ID` to the same file. See [Check-In / Webflow](#check-in--webflow-optional) for where to get them.

4. Create admin user:
```bash
npm run create-admin <username> <password>
```

5. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

For a short local setup walkthrough (JWT, `DATABASE_URL`, admin user), see **[SETUP.md](./SETUP.md)**.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── admin/        # Auth, users, waivers, search, CSV export
│   │   ├── checkin/      # Meta, lookup, person, attendance summary & event
│   │   └── waivers/      # Public waiver submission
│   ├── admin/
│   │   ├── checkin/      # Gate check-in UI
│   │   ├── tickets/      # Ticket counts / event rollups
│   │   └── …             # login, dashboard, users, waiver detail
│   ├── waiver/           # Waiver submission form
│   └── page.tsx          # Home page
├── components/
│   └── checkin/          # Shared check-in & ticket count UI
├── lib/
│   ├── db.ts, auth.ts, types.ts, typeahead-utils.ts
│   ├── webflow-orders.ts # Normalize Webflow orders / line items
│   └── checkin-*.ts      # Cache, config, person resolution, attendance, waiver lookup
├── hooks/
│   └── useTypeahead.ts
└── scripts/
    └── create-admin.ts
```

## Usage

**Players**: Navigate to home page → "Sign Waiver" → Fill form → Submit

**Admins**: Navigate to home page → "Admin Login" → Search waivers, **Check-In** (gate), **Ticket counts**, or manage users

### Check-In / Webflow (optional)

For purchase history on **Check-In** and rollups on **Ticket counts**, you need a Webflow Data API token and your **Site ID**. Copy variable names from [`.env.example`](./.env.example).

**1. API token (`WEBFLOW_API_TOKEN`)**

1. Open [Webflow Dashboard](https://webflow.com/dashboard) and select your **workspace** (not just a site).
2. Go to **Workspace settings** → **Integrations** → **API access** (wording may be **Developers** / **API** depending on plan).
3. **Generate API token** (or create a **Site token** scoped to the ecommerce site, if you use that flow).
4. Enable scopes that allow **reading ecommerce / orders** — at minimum **`ecommerce:read`** (and **`sites:read`** if the token wizard offers it, so you can list sites).

**2. Site ID (`WEBFLOW_SITE_ID`)**

- In Webflow: open the site → **Site settings** → **General** — many projects show a **Site ID** there, **or**
- With your token, run:
  ```bash
  curl -s -H "Authorization: Bearer YOUR_TOKEN" https://api.webflow.com/v2/sites
  ```
  Use the `id` of the site that has your store.

**3. Add to environment**

- **Local:** put both values in `.env` or `.env.local` (see [`.env.example`](./.env.example)), restart `npm run dev`.
- **Vercel:** **Project → Settings → Environment Variables** — add the same keys for **Preview** and **Production**, then redeploy.

| Variable | Description |
| -------- | ----------- |
| `WEBFLOW_API_TOKEN` | Bearer token (see above) |
| `WEBFLOW_SITE_ID` | Site UUID from settings or `GET /v2/sites` |
| `CHECKIN_SKU_PARTY_SIZE` | Optional JSON map, e.g. `{"my-sku-slug":3}` for party-size hints |
| `CHECKIN_SKU_DISPLAY` | Optional JSON map `sku → short label` for cleaner line names |
| `CHECKIN_EVENTS_JSON` | Optional JSON array for gate filter and tickets UI: `[{"id":"<productOrVariantId>","label":"Saturday game"}]`. Optional `defaultIncludedSkuKeys` (string[]) pre-selects only those SKU keys on **Tickets** (intersected with data; empty intersection falls back to all). |
| `CHECKIN_CACHE_TTL_MS` | Optional cache TTL (default 7 minutes) |

If Webflow env vars are omitted, waiver lookup still works; purchases will be empty.

## Deployment

**📖 See [DEPLOYMENT.md](./DEPLOYMENT.md) for production hosting, domains, and env vars.** Local bootstrap: [SETUP.md](./SETUP.md).

### Quick Deploy to Vercel

1. Push code to Git repository
2. Import project to [Vercel](https://vercel.com)
3. Set up [Supabase](https://supabase.com) database
4. Configure environment variables in Vercel:
   - `JWT_SECRET` (generate with `openssl rand -base64 32`)
   - `DATABASE_URL` (Supabase connection string)
   - `NODE_ENV=production`
5. Deploy

**Note**: This app requires Node.js server runtime and PostgreSQL database. GitHub Pages cannot host it.

## Security

- Generate strong JWT secrets: `openssl rand -base64 32`
- Never commit `.env` files or secrets
- Use HTTPS in production
- Store database credentials in environment variables

## Admin User Management

After deployment, create additional admin users via:
- **Web Interface**: Admin dashboard → "Manage Users"
- **Local Script**: `npm run create-admin <username> <password>`

## License

Proprietary - Coyote Force
