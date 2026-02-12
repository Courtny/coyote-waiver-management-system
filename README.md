# Coyote Force Waiver Management System

Waiver management system for Coyote Force Airsoft and Paintball. Players submit waivers online; admins can search and verify submissions.

## Features

- **Waiver Submission**: Personal info, emergency contact, electronic signature, photo release, minor tracking
- **Admin Dashboard**: Fuzzy search with typeahead, waiver status validation, admin user management
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

**Admins**: Navigate to home page → "Admin Login" → Search waivers → Manage users

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
