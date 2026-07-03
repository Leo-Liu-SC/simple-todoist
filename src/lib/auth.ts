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
