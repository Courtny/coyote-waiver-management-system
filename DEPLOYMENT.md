# Vercel Deployment Guide

This guide walks you through deploying the Coyote Waiver Management System to Vercel with the custom domain `waiver.coyoteforce.com`.

## Prerequisites

- Git repository with all code committed and pushed
- Vercel account (sign up at [vercel.com](https://vercel.com) - free tier available)
- Access to DNS settings for `coyoteforce.com` domain

## Step 1: Generate Production JWT Secret

Generate a strong random secret for production:

```bash
openssl rand -base64 32
```

Save this value securely - you'll need it in Step 3.

## Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Vercel will auto-detect Next.js configuration
5. Click **"Deploy"** (don't configure environment variables yet - we'll do that next)

## Step 3: Configure Environment Variables

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following variables:

   **JWT_SECRET**
   - Value: The secret you generated in Step 1
   - Environment: Production, Preview, Development (select all)

   **NODE_ENV**
   - Value: `production`
   - Environment: Production, Preview, Development (select all)

3. Click **"Save"**

## Step 4: Add Custom Domain

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `waiver.coyoteforce.com`
4. Click **"Add"**
5. Vercel will display DNS configuration instructions

## Step 5: Configure DNS Records

Configure DNS at your domain registrar (where `coyoteforce.com` is managed):

### Option A: CNAME Record (Recommended)

- **Type**: `CNAME`
- **Name**: `waiver`
- **Value**: `c76xxxkds.vercel-dns.com` (Vercel will provide the exact value)
- **TTL**: Auto or 3600

### Option B: A Record (Alternative)

- **Type**: `A`
- **Name**: `waiver`
- **Value**: Vercel's IP addresses (provided in Vercel dashboard)

**Note**: DNS propagation can take up to 48 hours, but usually completes within 1 hour.

## Step 6: Wait for Deployment and DNS

1. Vercel will automatically deploy your application
2. Wait for DNS propagation (check status in Vercel dashboard)
3. SSL certificate will be automatically provisioned by Vercel

## Step 7: Create Initial Admin User

After deployment, you need to create your first admin user. You have two options:

### Method A: Using the Script (Recommended for Initial Setup)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel env pull` to sync environment variables
3. Run: `npm run create-admin <username> <password>`

For example:
```bash
npm run create-admin admin mySecurePassword123
```

### Method B: Using Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL (replace with your desired username and password hash):

```sql
-- First, generate a password hash using bcrypt (you can use an online bcrypt generator)
-- Then insert the admin user:
INSERT INTO admin_users (username, passwordHash) 
VALUES ('admin', '$2a$10$YourGeneratedHashHere');
```

**Note:** After creating your first admin user, you can use the **Admin User Management** interface in the dashboard (`/admin/users`) to create additional admin users securely.

## Step 8: Verify Deployment

Test the following:

- [ ] Visit `https://waiver.coyoteforce.com` - home page loads
- [ ] Visit `https://waiver.coyoteforce.com/waiver` - waiver form loads
- [ ] Submit a test waiver - form submission works
- [ ] Visit `https://waiver.coyoteforce.com/admin/login` - login page loads
- [ ] Login with admin credentials - dashboard loads
- [ ] Search for test waiver - search functionality works
- [ ] Verify SSL certificate is active (HTTPS in address bar)

## Important Notes

### Database Setup (Supabase)

**Current Setup**: The application uses Supabase (PostgreSQL) for persistent data storage.

**To set up Supabase:**

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and sign up/log in
   - Click **New Project**
   - Choose a name for your project (e.g., "coyote-waivers")
   - Set a database password (save this securely)
   - Select a region closest to your users
   - Click **Create new project**

2. **Get Connection String:**
   - In your Supabase project dashboard, go to **Settings** → **Database**
   - Find the **Connection string** section
   - Copy the **URI** connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

3. **Add to Vercel:**
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add a new variable:
     - **Name**: `DATABASE_URL` (or `POSTGRES_URL`)
     - **Value**: Paste your Supabase connection string
     - **Environment**: Production, Preview, Development (select all)
   - Click **Save**

**Environment Variables:**
- `DATABASE_URL` or `POSTGRES_URL` - Your Supabase PostgreSQL connection string
- `JWT_SECRET` - Set this manually for production (use a strong random string)

**Note:** The database schema will be automatically created on first use when the application runs. You can also run the schema manually in Supabase's SQL Editor if needed.

## Troubleshooting

### DNS Not Resolving
- Wait for DNS propagation (can take up to 48 hours)
- Verify DNS records are correct at your domain registrar
- Check DNS propagation status: [whatsmydns.net](https://www.whatsmydns.net)

### Build Failures
- Check environment variables are set correctly
- Verify Node.js version compatibility (Vercel uses Node.js 18.x by default)
- Check build logs in Vercel dashboard for specific errors

### Admin Login Fails
- Verify admin user was created successfully
- Check that `JWT_SECRET` environment variable is set
- Verify you're using the correct username and password

### Database Issues
- SQLite files may not persist across deployments
- Consider migrating to Vercel Postgres for production
- Check Vercel function logs for database errors

## Security Checklist

- [ ] `JWT_SECRET` is set to a strong random value
- [ ] Temporary admin creation endpoint has been deleted
- [ ] Admin credentials are stored securely
- [ ] HTTPS/SSL is active (Vercel provides this automatically)
- [ ] Environment variables are not committed to Git

## Support

For Vercel-specific issues, consult:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
