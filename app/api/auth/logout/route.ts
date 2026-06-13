import { NextRequest, NextResponse } from 'next/server';

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('sb-session-token');
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');

  return response;
}

export async function GET(request: NextRequest) {
  try {
    return clearAuthCookies(NextResponse.redirect(new URL('/', request.url)));
  } catch (error) {
    console.error('Logout redirect error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export async function POST() {
  try {
    // Create response with cleared session cookie
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    return clearAuthCookies(response);
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
