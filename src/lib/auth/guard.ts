import { NextResponse } from "next/server";
import { verifyToken, type TokenPayload } from "./token";

/**
 * Protect an API route. Returns the user payload or a 401 response.
 *
 * Usage:
 *   const [user, errorResponse] = await requireAuth();
 *   if (errorResponse) return errorResponse;
 *   // user is guaranteed to be TokenPayload
 */
export async function requireAuth(
  cookieName = "auth_token"
): Promise<[TokenPayload, null] | [null, NextResponse]> {
  const user = await verifyToken(cookieName);
  if (!user) {
    return [null, NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })];
  }
  return [user, null];
}
