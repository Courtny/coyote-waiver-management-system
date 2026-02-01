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

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name
    });
    
    // Check if user already exists
    if (error.message?.includes('UNIQUE constraint') || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Return more detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { 
        error: 'Failed to create admin user',
        ...(isDevelopment && {
          details: error?.message || String(error),
          code: error?.code
        })
      },
      { status: 500 }
    );
  }
}
