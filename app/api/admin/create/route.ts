import { NextRequest, NextResponse } from 'next/server';
import { createAdminUser } from '@/lib/auth';

/**
 * TEMPORARY ENDPOINT FOR CREATING ADMIN USER
 * 
 * ⚠️ SECURITY WARNING: This endpoint should be DELETED after creating the admin user.
 * It allows anyone to create admin accounts if they know this endpoint exists.
 * 
 * Usage:
 * POST /api/admin/create
 * Body: { "username": "admin", "password": "yourpassword" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    await createAdminUser(username, password);

    return NextResponse.json({
      success: true,
      message: `Admin user "${username}" created successfully. Please DELETE this endpoint now for security.`,
    });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    
    // Check if user already exists
    if (error.message?.includes('UNIQUE constraint') || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}
