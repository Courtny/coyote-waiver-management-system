# Quick Setup Guide

## Step 1: Create .env File

Create a `.env` file in the project root with the following content:

```
JWT_SECRET=mWm8XvjG3Y5+6O1Qy6yklRZtLCVdjBbh8CilaXP36k4=
NODE_ENV=development
```

You can create this file by running:
```bash
echo "JWT_SECRET=mWm8XvjG3Y5+6O1Qy6yklRZtLCVdjBbh8CilaXP36k4=" > .env
echo "NODE_ENV=development" >> .env
```

Or manually create the file and paste the content above.

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
