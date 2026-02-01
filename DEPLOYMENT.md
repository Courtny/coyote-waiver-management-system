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

## Step 7: Create Admin User

After deployment, create your admin user using one of these methods:

### Method A: Temporary API Endpoint (Easiest)

1. The temporary endpoint `/api/admin/create` has been created for you
2. Make a POST request to create an admin user:

```bash
curl -X POST https://waiver.coyoteforce.com/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "yourSecurePassword123"}'
```

Or use a tool like Postman or your browser's developer console.

3. **IMPORTANT**: After creating the admin user, **DELETE** the file `app/api/admin/create/route.ts` and commit the change. This endpoint is a security risk if left active.

### Method B: Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel env pull` to sync environment variables
3. Run: `npm run create-admin admin yourpassword`

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

### Database Persistence

**⚠️ Important**: Vercel uses serverless functions with an ephemeral filesystem. SQLite files may not persist reliably across deployments.

**Current Setup**: SQLite will work for initial deployment and small-scale usage, but data may be lost during deployments.

**Recommended for Production**: Migrate to Vercel Postgres (free tier available) for reliable data persistence. See migration guide below.

### Future Database Migration to Vercel Postgres

When ready to migrate to a production database:

1. Create Vercel Postgres database in Vercel dashboard
2. Update `lib/db.ts` to use PostgreSQL connection
3. Migrate schema and existing data
4. Update environment variables with database connection string

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
