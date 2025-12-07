import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkCsrf, checkRateLimit } from "@/utils/security";
const differenceInHours = (dateLeft: Date, dateRight: Date) =>
  Math.floor((dateLeft.getTime() - dateRight.getTime()) / 36e5);

export async function POST(request: Request) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 30, identifier: "check_verification" });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { email } = body;
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const needsVerification =
    !user.emailVerified ||
    (user.lastLogin && differenceInHours(new Date(), user.lastLogin) >= 24);

  return NextResponse.json({ needsVerification });
}
