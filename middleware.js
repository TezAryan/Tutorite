import { withAuth } from 'next-auth/middleware';

export const middleware = withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Protect teacher routes
    if (pathname.startsWith('/dashboard/teacher')) {
      if (!token || token.role !== 'teacher') {
        return Response.redirect(new URL('/login', req.url));
      }
    }

    // Protect student routes
    if (pathname.startsWith('/dashboard/student')) {
      if (!token || token.role !== 'student') {
        return Response.redirect(new URL('/login', req.url));
      }
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        return Response.redirect(new URL('/login', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes
        if (pathname === '/' || pathname.startsWith('/(auth)')) {
          return true;
        }

        // Require auth for protected routes
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/admin') ||
          pathname.startsWith('/session')
        ) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
