# Coyote Force Waiver Management System

Waiver management system for Coyote Force Airsoft and Paintball. Players submit waivers online; admins can search and verify submissions.

## Features

- **Waiver Submission**: Personal info, emergency contact, electronic signature, photo release, minor tracking
- **Admin Dashboard**: Fuzzy search with typeahead, waiver status validation, admin user management
- **Check-In** (`/admin/checkin`): Person-first lookup — current-year waiver status plus Webflow ecommerce orders (cached), optional gate product filter
- **Security**: JWT authentication, bcrypt password hashing

## Tech Stack

- Next.js 14, TypeScript
- PostgreSQL (Supabase)
- JWT, bcryptjs
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
echo "NODE_ENV=development" >> .env
```

For production, add your Supabase connection string:
```
DATABASE_URL=your-supabase-connection-string
```

4. Create admin user:
```bash
npm run create-admin <username> <password>
```

5. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/              # API routes (waivers, admin)
│   ├── admin/            # Admin pages (login, dashboard, users, waivers)
│   ├── waiver/           # Waiver submission form
│   └── page.tsx          # Home page
├── lib/
│   ├── db.ts             # PostgreSQL connection
│   ├── auth.ts           # Authentication
│   ├── types.ts          # TypeScript types
│   └── typeahead-utils.ts
├── hooks/
│   └── useTypeahead.ts
└── scripts/
    └── create-admin.ts
```

## Usage

**Players**: Navigate to home page → "Sign Waiver" → Fill form → Submit

**Admins**: Navigate to home page → "Admin Login" → Search waivers, **Check-In** (gate), or manage users

### Check-In / Webflow (optional)

For purchase history on the check-in page, add a Webflow Data API token with **ecommerce:read** and your site ID:

| Variable | Description |
| -------- | ----------- |
| `WEBFLOW_API_TOKEN` | Bearer token from Webflow workspace |
| `WEBFLOW_SITE_ID` | Site ID (orders are listed per site) |
| `CHECKIN_SKU_PARTY_SIZE` | Optional JSON map, e.g. `{"my-sku-slug":3}` for party-size hints |
| `CHECKIN_SKU_DISPLAY` | Optional JSON map `sku → short label` for cleaner line names |
| `CHECKIN_EVENTS_JSON` | Optional JSON array: `[{"id":"<productOrVariantId>","label":"Saturday game"}]` for gate filter dropdown |
| `CHECKIN_CACHE_TTL_MS` | Optional cache TTL (default 7 minutes) |

If Webflow env vars are omitted, waiver lookup still works; purchases will be empty.

## Deployment

**📖 See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions**

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
