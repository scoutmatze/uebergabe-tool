import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = new URL("/login", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set("auth_token", "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
