import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRange = createRouteMatcher([
  '/proscanner(.*)',
  '/subscription(.*)',
  '/scanner(.*)',
  '/list(.*)',
  '/api/pipeline(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRange(req)) {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      return auth.redirectToSignIn();
    }

    // Super Admin Bypass for rajadsinfo@gmail.com
    const userEmail = session?.sessionClaims?.email || session?.sessionClaims?.primaryEmailAddress;
    if (userEmail === "rajadsinfo@gmail.com") {
      return NextResponse.next();
    }

    await auth.protect();
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};