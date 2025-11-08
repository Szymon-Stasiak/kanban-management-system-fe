import {NextRequest, NextResponse} from 'next/server';

export function proxy(req: NextRequest) {

    const token = req.cookies.get('token')?.value;
    const url = req.nextUrl.clone();

    const publicPaths = ['/login'];

    if (!token && !publicPaths.includes(url.pathname)) {
        url.pathname = '/';
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
};
