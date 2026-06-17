import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const role = request.cookies.get('user_role')?.value;
    const { pathname } = request.nextUrl;

    // Routes that require authentication
    const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/pos');
    
    // Auth redirect
    if (isProtected && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based protection
    if (token) {
        if (pathname.startsWith('/dashboard') && role === 'Cashier') {
            // Cashiers cannot access dashboard
            return NextResponse.redirect(new URL('/pos', request.url));
        }

        // Redirect authenticated users away from login
        if (pathname === '/login') {
            if (role === 'Cashier') {
                return NextResponse.redirect(new URL('/pos', request.url));
            } else {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/pos/:path*', '/login'],
};
