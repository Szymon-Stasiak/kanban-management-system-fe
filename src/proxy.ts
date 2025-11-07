import {NextRequest, NextResponse} from 'next/server';

export function proxy(req: NextRequest) {

    const token = req.cookies.get('token')?.value;
    console.log('Sprawdzanie tokenu uwierzytelniającego:', token);
    const url = req.nextUrl.clone();

    const publicPaths = ['/'];

    if (!token && !publicPaths.includes(url.pathname)) {
        url.pathname = '/';
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
};
