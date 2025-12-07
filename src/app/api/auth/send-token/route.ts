import { NextResponse } from "next/server";
import { checkCsrf, checkRateLimit } from "@/utils/security";
import { createAndSendVerificationToken } from "@/src/lib/verificationService";

export async function POST(request: Request) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 10, identifier: "send_token" });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { email, name } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    await createAndSendVerificationToken(email, name);
    return NextResponse.json({ success: true, message: "Verification token sent" });
  } catch (error) {
    console.error("Error sending verification token", error);
    return NextResponse.json({ error: "Failed to send token" }, { status: 500 });
  }
}
