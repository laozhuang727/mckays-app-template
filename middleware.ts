import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Temporarily disable Clerk authentication for FigJam development
export function middleware(request: NextRequest) {
  // Allow all requests to pass through for now
  // We'll re-enable authentication later
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)"
  ]
}
