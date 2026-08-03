import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/proscanner(.*)", "/subscription(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();
  const userId = session?.userId;
  
  // If the route is protected
  if (isProtectedRoute(req)) {
    if (!userId) {
      // Redirect unauthenticated users to sign in
      return auth().redirectToSignIn();
    }

    // Optional: Fetch user email from session claims if available in middleware
    const userEmail = session?.sessionClaims?.email || session?.sessionClaims?.primaryEmailAddress;

    // Super Admin Bypass in Middleware
    if (userEmail === "rajadsinfo@gmail.com") {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|fed|git)).*)',
    '/',
    '/(api|trpc)(%.*)?',
  ],
};