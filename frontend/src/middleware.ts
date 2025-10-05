// middleware.ts - TEMPORARY BYPASS (use this to test)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('admin access');
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};