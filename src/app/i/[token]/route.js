import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { token: code } = await params;
  let token = code || "";
  if (/^(?:[a-f\d]{2}){16,40}$/i.test(token)) {
    // Older invitation links already use the original hexadecimal token.
  } else if (/^[a-z\d_-]{22,54}$/i.test(token)) {
    try {
      const decoded = Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/"), "base64");
      const canonical = decoded.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      if (canonical !== token || decoded.length < 16 || decoded.length > 40) throw new Error("Invalid invite code");
      token = decoded.toString("hex");
    } catch {
      token = "";
    }
  } else {
    token = "";
  }
  if (!token) {
    return NextResponse.redirect(new URL("/amis?invitation=invalid", request.url), 303);
  }

  const destination = new URL("/amis", request.url);
  destination.searchParams.set("invitation", token);
  return NextResponse.redirect(destination, 303);
}
