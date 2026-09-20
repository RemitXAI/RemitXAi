import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/dashboard'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // redirect to the existing auth page (`/auth`). There is no
        // `/auth/login` route in this app, which caused 404s on Vercel.
        const loginUrl = new URL('/auth', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (err) {
      // If Supabase auth check fails in the middleware (common on some edge
      // environments like Vercel), don't block the request — allow the page to
      // render and handle auth client-side. This prevents unexpected 404s.
      console.error('Middleware auth check failed, allowing request:', err);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};