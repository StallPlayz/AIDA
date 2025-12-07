import { prisma } from "@/src/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "./emailService";

const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60000);

const isAfter = (date: Date, dateToCompare: Date) =>
  date.getTime() > dateToCompare.getTime();

export async function createAndSendVerificationToken(email: string, name?: string) {
  const token = crypto.randomInt(100000, 999999).toString();
  const expires = addMinutes(new Date(), 5);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  let emailSent = true;
  try {
    await sendVerificationEmail({
      to: email,
      name: name || "User",
      token,
      expires,
    });
  } catch (err) {
    console.error("Failed to send verification email:", err);
    emailSent = false;
  }

  return { token, expires, emailSent };
}

export async function verifyToken(email: string, token: string) {
  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token },
  });

  if (!record) return { valid: false, reason: "INVALID_TOKEN" };
  if (isAfter(new Date(), record.expires)) {
    await prisma.verificationToken.delete({ where: { token } });
    return { valid: false, reason: "EXPIRED" };
  }

  await prisma.verificationToken.delete({ where: { token } });
  return { valid: true };
}
