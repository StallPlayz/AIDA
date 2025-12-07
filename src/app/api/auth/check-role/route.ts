import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { role: null, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        role: true,
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { role: null, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { error: "Failed to check user role" },
      { status: 500 }
    );
  }
}