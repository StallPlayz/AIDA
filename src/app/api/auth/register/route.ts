import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, checkCsrf } from "@/utils/security";
import { createAndSendVerificationToken } from "@/src/lib/verificationService";

export async function POST(request: Request) {
  try {
    const csrf = checkCsrf(request);
    if (csrf) return csrf;

    const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 10, identifier: "register" });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { email, password, username, name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const strongEnough =
      typeof password === "string" &&
      password.length >= 10 &&
      /[A-Za-z]/.test(password) &&
      /[0-9]/.test(password);

    if (!strongEnough) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 10 characters long and include letters and numbers",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if username is taken
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        name,
        authProvider: "EMAIL",
        role: "CUSTOMER",
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      },
    });

    // Create verification token (5 minutes) and send email
    const { emailSent } = await createAndSendVerificationToken(email, name || username || "User");

    return NextResponse.json(
      {
        message: "User created successfully. Please verify your email.",
        user,
        requiresVerification: true,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
