"use server";

import { cookies } from "next/headers";
import { verifyJWT, signJWT, type JWTPayload } from "@/backend/utility/jwt";

const COOKIE_NAME = "meethub.session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function createSession(payload: Omit<JWTPayload, "iat" | "exp">) {
  const token = await signJWT(payload);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return token;
}

export async function getSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value;
}

export async function getSession(): Promise<JWTPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifyJWT(token);
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
