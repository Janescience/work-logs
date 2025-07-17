import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    // `withAuth` augments the Next.js `Request` with the user's token.
    function middleware(req) {
        // console.log("Middleware token:", req.nextauth.token);
        // console.log("Middleware URL:", req.nextUrl.pathname);

        // *** NEW: ถ้าผู้ใช้ Login อยู่แล้ว และพยายามเข้าถึงหน้า /login ให้ redirect ไปหน้า Dashboard ***
        if (req.nextUrl.pathname === '/login' && req.nextauth.token) {
            console.log('User already logged in, redirecting from /login to /');
            return NextResponse.redirect(new URL('/', req.url));
        }

        // ปรับปรุงการตรวจสอบ Role สำหรับ Admin Routes
        if (req.nextUrl.pathname.startsWith('/admin') && !req.nextauth.token?.roles?.includes('ADMIN')) {
            console.log(`Unauthorized admin access attempt to ${req.nextUrl.pathname}. Redirecting to /denied.`);
            return NextResponse.rewrite(new URL('/denied', req.url));
        }

        return NextResponse.next(); // Continue if authorized or not a protected path
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const publicPaths = ['/login', '/register', '/api/auth', '/api/register', '/_next'];
                // ถ้า token มีค่า และ Path เป็น /login, เราจะให้ authorized เป็น true เพื่อให้ middleware function ทำงาน
                // แล้ว middleware function จะจัดการ redirect เอง (ตาม Logic ที่เพิ่มใหม่ด้านบน)
                if (req.nextUrl.pathname === '/login' && token) {
                    return true;
                }

                if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
                    return true;
                }

                if (req.nextUrl.pathname.startsWith('/denied')) {
                    return true;
                }

                return !!token;
            }
        },
        pages: {
            signIn: '/login', // Redirect unauthenticated users to this page
        }
    }
);

export const config = {
    // matcher นี้จะบอก Next.js ว่า middleware ควรทำงานกับ Path ไหนบ้าง
    // เราต้องมั่นใจว่า /login ถูกรวมอยู่ใน matcher ด้วย
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // Match all paths except API, static, images
};
