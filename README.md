# Coyote Force Waiver Management System

A comprehensive waiver management system for Coyote Force Airsoft and Paintball business. This system allows players to submit waivers online and provides an admin interface to search and verify waiver submissions.

## Features

- **Waiver Submission Form**: Players can submit waivers with all required information including:
  - Personal information (name, email, phone, date of birth)
  - Emergency contact information
  - Electronic signature with canvas-based signature capture
  - Automatic year tracking
  - Photo release consent
  - Minor name tracking

- **Admin Dashboard**: 
  - **Fuzzy Search with Typeahead**: Advanced search with autocomplete suggestions
    - Case-insensitive and typo-tolerant matching
    - Real-time suggestions as you type
    - Search by name, birth year, or minor names
    - Keyboard and mouse navigation support
  - View all waiver submissions with details
  - View waiver status (current year validation)
  - Secure authentication system
  - Admin user management interface (create, list, delete admin users)

- **Current Year Validation**: Automatically tracks and validates if a player has a waiver on file for the current year

- **Security Features**:
  - JWT-based authentication
  - Password hashing with bcrypt
  - Secure admin user management
  - Environment variable configuration

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **PostgreSQL (Supabase)** - Production database with persistent storage
- **pg (node-postgres)** - PostgreSQL client library
- **bcryptjs** - Password hashing for admin authentication
- **JWT** - Token-based authentication
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

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

Create a `.env` file in the project root. Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

Create the `.env` file:
```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
echo "NODE_ENV=development" >> .env
```

For production with Supabase, also add:
```
DATABASE_URL=your-supabase-connection-string
```

**⚠️ Security Warning**: Never commit the `.env` file or secrets to your repository.

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
├── app/
│   ├── api/                # API routes
│   │   ├── waivers/       # Waiver submission endpoint
│   │   └── admin/         # Admin endpoints (search, auth, users)
│   ├── admin/             # Admin pages (dashboard, login, users, waivers)
│   ├── waiver/            # Waiver submission form
│   └── page.tsx           # Home page
├── lib/
│   ├── db.ts              # PostgreSQL database setup and connection
│   ├── auth.ts            # Authentication utilities
│   ├── types.ts           # TypeScript type definitions
│   └── typeahead-utils.ts # Typeahead utility functions
├── hooks/
│   └── useTypeahead.ts    # Reusable typeahead hook
└── scripts/
    └── create-admin.ts    # Script to create admin users locally
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
4. Use the search bar with typeahead autocomplete to find players:
   - Start typing a name, birth year, or minor name
   - Select from suggestions or press Enter to search
   - Search supports fuzzy matching (handles typos and case variations)
5. View waiver status - green checkmark indicates valid current year waiver
6. Manage admin users from the "Manage Users" link in the dashboard
7. Click on any waiver to view full details

## Deployment

### ⚠️ GitHub Pages Limitation

**GitHub Pages cannot host this application** because it only serves static HTML/CSS/JavaScript files. This application requires:
- Server-side API routes (waiver submission, admin search, authentication)
- Database (PostgreSQL) with persistent storage
- Node.js server runtime

### Recommended: Deploying to Vercel with Supabase (Free & Easy - Best Option)

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

3. Set up Supabase database:
   - Create a project at [supabase.com](https://supabase.com)
   - Get your connection string from Settings → Database
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions

4. Configure environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add `JWT_SECRET` with a strong random value (generate with `openssl rand -base64 32`)
   - Add `DATABASE_URL` or `POSTGRES_URL` with your Supabase connection string
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
1. Set up Supabase PostgreSQL database
2. Set environment variables (JWT_SECRET, DATABASE_URL, NODE_ENV)
3. Build command: `npm run build`
4. Start command: `npm start`
5. The database schema will be created automatically on first use

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

**Note**: The application uses Supabase (PostgreSQL) for production deployments, providing persistent storage and better scalability than SQLite.

## Security Considerations

- **JWT Secret**: Always use a strong, random JWT secret in production (generate with `openssl rand -base64 32`)
- **HTTPS**: Ensure your deployment uses HTTPS (Vercel provides this automatically)
- **Admin Passwords**: Use strong passwords for admin accounts (minimum 8 characters)
- **Database**: PostgreSQL connection strings contain credentials - store securely in environment variables
- **Environment Variables**: Never commit `.env` files or secrets to version control
- **Secrets in Documentation**: All documentation uses placeholders - generate your own secrets

## Creating Additional Admin Users

To create additional admin users after deployment:

1. **Using the Admin Interface (Recommended)**:
   - Log in to the admin dashboard
   - Click "Manage Users" in the header
   - Use the "Create New Admin User" form

2. **Using the Local Script**:
   - Use Vercel CLI: `vercel env pull` to sync environment variables
   - Run: `npm run create-admin <username> <password>`

The admin user management interface allows you to create, list, and delete admin users securely through the web interface.

## Support

For issues or questions, please contact the development team.

## License

Proprietary - Coyote Force
