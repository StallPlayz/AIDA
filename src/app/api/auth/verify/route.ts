import { NextResponse } from "next/server";
import { checkCsrf, checkRateLimit } from "@/utils/security";
import { prisma } from "@/src/lib/prisma";
import { verifyToken } from "@/src/lib/verificationService";

export async function POST(request: Request) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 20, identifier: "verify_token" });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { email, token } = body;

  if (!email || !token) {
    return NextResponse.json({ error: "Email and token are required" }, { status: 400 });
  }

  const result = await verifyToken(email, token);
  if (!result.valid) {
    return NextResponse.json({ error: result.reason || "Invalid token" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      lastLogin: new Date(),
    },
  });

  return NextResponse.json({ success: true, message: "Email verified" });
}
