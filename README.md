# Coyote Force Waiver Management System

A comprehensive waiver management system for Coyote Force Airsoft and Paintball business. This system allows players to submit waivers online and provides an admin interface to search and verify waiver submissions.

## Features

- **Waiver Submission Form**: Players can submit waivers with all required information including:
  - Personal information (name, email, phone, date of birth)
  - Emergency contact information
  - Electronic signature
  - Automatic year tracking

- **Admin Dashboard**: 
  - Search waivers by player name
  - View waiver status (current year validation)
  - See all waiver submissions with details
  - Secure authentication system
  - Admin user management interface

- **Current Year Validation**: Automatically tracks and validates if a player has a waiver on file for the current year

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **SQLite** - Lightweight database (can be upgraded to PostgreSQL for production)
- **bcryptjs** - Password hashing for admin authentication
- **JWT** - Token-based authentication

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET` for production:
```
JWT_SECRET=your-strong-random-secret-key-here
```

4. Create an admin user:
```bash
npm run create-admin <username> <password>
```

For example:
```bash
npm run create-admin admin mySecurePassword123
```

**Note:** After creating your first admin user, you can log in to the admin dashboard and use the **Admin User Management** page (`/admin/users`) to create and manage additional admin users through the web interface.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── waivers/          # Waiver submission endpoint
│   │   └── admin/            # Admin authentication and search endpoints
│   ├── admin/
│   │   ├── login/           # Admin login page
│   │   └── dashboard/       # Admin dashboard with search
│   ├── waiver/              # Waiver submission form
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── lib/
│   ├── db.ts               # Database setup and connection
│   ├── auth.ts             # Authentication utilities
│   └── types.ts            # TypeScript type definitions
├── scripts/
│   └── create-admin.ts     # Script to create admin users
└── waivers.db              # SQLite database (created automatically)
```

## Usage

### For Players

1. Navigate to the home page
2. Click "Sign Waiver"
3. Fill out all required fields
4. Type your full name as electronic signature
5. Submit the waiver

### For Admins

1. Navigate to the home page
2. Click "Admin Login"
3. Enter your admin credentials
4. Use the search bar to find players by name
5. View waiver status - green checkmark indicates valid current year waiver

## Deployment

### ⚠️ GitHub Pages Limitation

**GitHub Pages cannot host this application** because it only serves static HTML/CSS/JavaScript files. This application requires:
- Server-side API routes (waiver submission, admin search, authentication)
- Database (SQLite) with file system access
- Node.js server runtime

### Recommended: Deploying to Vercel (Free & Easy - Best Option)

**📖 For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

**Why Vercel?**
- ✅ Free tier with generous limits
- ✅ Perfect for Next.js (made by the Next.js team)
- ✅ Automatic HTTPS
- ✅ Easy custom domain setup
- ✅ Zero configuration needed
- ✅ Free SSL certificates

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Import your project to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. Configure environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add `JWT_SECRET` with a strong random value
   - Add `NODE_ENV=production`

4. Deploy!

5. Configure your subdomain (waiver.coyoteforce.com):
   - In Vercel project settings, go to Domains
   - Add your custom domain
   - Configure DNS records as instructed by Vercel

### Alternative Free Hosting Options

If you prefer not to use Vercel, here are other free options that support Node.js:

**Railway** (railway.app)
- Free tier with $5 credit/month
- Easy PostgreSQL setup (better than SQLite for production)
- Simple deployment from GitHub

**Render** (render.com)
- Free tier available
- Automatic deployments from GitHub
- Supports PostgreSQL

**Netlify** (netlify.com)
- Free tier available
- Note: Requires Netlify Functions for API routes (slight code changes needed)

**For all platforms:**
1. Set environment variables as described above
2. Build command: `npm run build`
3. Start command: `npm start`
4. The database file (`waivers.db`) will be created automatically

### Why Not GitHub Pages?

GitHub Pages is designed for static sites (like documentation, portfolios, or simple HTML pages). It cannot:
- Run Node.js code
- Execute server-side API routes
- Access file system for databases
- Handle server-side authentication

If you absolutely need to use GitHub Pages, you would need to:
1. Convert the frontend to static HTML/React
2. Host the backend separately (on Railway, Render, or similar)
3. Refactor all API calls to point to the external backend

This would require significant code changes and is not recommended when free alternatives like Vercel work perfectly with the current setup.

**Note**: For production, consider migrating to PostgreSQL or another production database. SQLite works well for small to medium deployments but has limitations for high-traffic scenarios.

### Database Migration (Optional)

For production deployments with high traffic, consider migrating to PostgreSQL:

1. Install PostgreSQL adapter (e.g., `pg` or use Prisma)
2. Update `lib/db.ts` to use PostgreSQL connection
3. Update SQL queries if needed (SQLite and PostgreSQL have minor syntax differences)

## Security Considerations

- **JWT Secret**: Always use a strong, random JWT secret in production
- **HTTPS**: Ensure your deployment uses HTTPS (Vercel provides this automatically)
- **Admin Passwords**: Use strong passwords for admin accounts
- **Database**: The SQLite database contains sensitive information - ensure proper file permissions
- **Environment Variables**: Never commit `.env` file to version control

## Creating Additional Admin Users

To create additional admin users after deployment:

1. SSH into your server (if self-hosted) or use Vercel CLI
2. Run: `npm run create-admin <username> <password>`

Or create a temporary admin creation endpoint (remove after use for security).

## Support

For issues or questions, please contact the development team.

## License

Proprietary - Coyote Force
