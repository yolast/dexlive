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
    if (!session?.userId) {
      return auth.redirectToSignIn();
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