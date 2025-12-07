// Simple security helpers for API routes
import { NextResponse } from "next/server";

type RateKey = string;

type RateState = {
  last: number[];
};

// Keep a tiny in-memory rate limiter (per process)
const globalStore =
  (globalThis as any).__aida_rate_limit ??
  ((globalThis as any).__aida_rate_limit = new Map<RateKey, RateState>());

export function checkRateLimit(
  request: Request,
  opts: { windowMs?: number; limit?: number; identifier?: string } = {}
): NextResponse | null {
  const windowMs = opts.windowMs ?? 60_000;
  const limit = opts.limit ?? 20;
  const ip =
    opts.identifier ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = `${ip}:${opts.identifier || request.url}`;
  const now = Date.now();
  const bucket = globalStore.get(key) || { last: [] };
  // remove old
  bucket.last = bucket.last.filter((t) => now - t < windowMs);
  if (bucket.last.length >= limit) {
    return NextResponse.json(
      { error: "Too many requests, please try again later" },
      { status: 429 }
    );
  }
  bucket.last.push(now);
  globalStore.set(key, bucket);
  return null;
}

export function checkCsrf(request: Request): NextResponse | null {
  // Enforce same-origin for state-changing requests
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return null; // cannot verify, allow (tolerant for server-to-server)
  try {
    const url = new URL(origin);
    if (url.host !== host) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }
  return null;
}
