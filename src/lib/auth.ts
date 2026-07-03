import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

export async function signToken() {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function getAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("auth")?.value;
}

export async function isAuthenticated() {
  const token = await getAuthCookie();
  if (!token) return false;
  return verifyToken(token);
}

export async function requireAuth(req: NextRequest) {
  const token = req.cookies.get("auth")?.value;
  if (!token) return false;
  return verifyToken(token);
}

// Bearer-token auth for the external API (/api/v1/*). External apps send
// `Authorization: Bearer <API_TOKEN>`. Uses a constant-time comparison.
export function requireApiToken(req: NextRequest): boolean {
  const expected = process.env.API_TOKEN;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const provided = match[1];
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
