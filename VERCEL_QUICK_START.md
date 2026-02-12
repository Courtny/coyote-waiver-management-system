# Vercel Deployment Quick Start

## Generate JWT Secret

Generate a strong random secret for production:
```bash
openssl rand -base64 32
```

**Save this securely** - you'll need it when configuring Vercel environment variables.

**⚠️ Security Warning**: Never commit JWT secrets to your repository. Always use environment variables.

## Manual Steps Required

The following steps must be completed in the Vercel dashboard and your domain registrar:

### ✅ Completed Automatically
- [x] Generated production JWT secret
- [x] Created temporary admin creation endpoint (`/api/admin/create`)
- [x] Created deployment documentation (`DEPLOYMENT.md`)

### 📋 To Do (Manual Steps)

1. **Initialize Git Repository** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Vercel Project**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Click "Deploy"

3. **Configure Environment Variables**
   - In Vercel project: Settings → Environment Variables
   - Add `JWT_SECRET` = `<your-generated-secret-from-step-above>`
   - Add `NODE_ENV` = `production`
   - Select all environments (Production, Preview, Development)

4. **Add Custom Domain**
   - In Vercel project: Settings → Domains
   - Add domain: `waiver.coyoteforce.com`
   - Follow DNS instructions provided by Vercel

5. **Configure DNS at Domain Registrar**
   - Add CNAME record: `waiver` → Vercel's provided value
   - Wait for DNS propagation (usually < 1 hour)

6. **Create Admin User** (after deployment)
   ```bash
   curl -X POST https://waiver.coyoteforce.com/api/admin/create \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "yourSecurePassword123"}'
   ```
   **Then DELETE** `app/api/admin/create/route.ts` for security!

7. **Verify Deployment**
   - Test waiver form at `https://waiver.coyoteforce.com/waiver`
   - Test admin login at `https://waiver.coyoteforce.com/admin/login`
   - Verify all functionality works

## Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions and troubleshooting.
