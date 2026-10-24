import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.APP_SECRET || "fallback-secret-change-me");

export interface TokenPayload {
  userId: number;
  email: string;
}

export async function createToken(userId: number, email: string, cookieName = "auth_token") {
  const token = await new SignJWT({ userId, email } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifyToken(cookieName = "auth_token"): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string, response: Response, cookieName = "auth_token") {
  // Helper for setting cookie on NextResponse
  (response as any).cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
