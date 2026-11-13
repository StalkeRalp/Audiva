import { NextResponse } from "next/server";

export function proxy(request) {
  // Auth is managed by the browser Supabase client. A getUser() request here
  // required the network on every navigation without protecting any route.
  return NextResponse.next({ request });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
