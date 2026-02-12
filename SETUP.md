# Quick Setup Guide

## Step 1: Create .env File

Create a `.env` file in the project root with the following content:

```
JWT_SECRET=your-strong-random-secret-key-here
NODE_ENV=development
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

You can create the `.env` file by running:
```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
echo "NODE_ENV=development" >> .env
```

Or manually create the file and paste the content above, replacing `your-strong-random-secret-key-here` with your generated secret.

**⚠️ Security Warning**: Never commit the `.env` file or JWT secrets to your repository.

## Step 2: Create Admin User

Run:
```bash
npm run create-admin admin yourpassword123
```

Replace `admin` with your desired username and `yourpassword123` with your desired password.

## Step 3: Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## Step 4: Test the Application

1. Navigate to http://localhost:3000/waiver to test the waiver form
2. Navigate to http://localhost:3000/admin/login to test the admin dashboard
