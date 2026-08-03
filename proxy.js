import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/proscanner(.*)',
  '/subscription(.*)',
  '/scanner(.*)',
  '/list(.*)',
  '/api/pipeline(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();
  const userId = session?.userId;

  if (isProtectedRoute(req)) {
    if (!userId) {
      return auth.redirectToSignIn();
    }

    // Super Admin Bypass for rajadsinfo@gmail.com via session claims or token attributes
    const userEmail = session?.sessionClaims?.email || session?.sessionClaims?.primaryEmailAddress;
    if (userEmail === "rajadsinfo@gmail.com") {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};