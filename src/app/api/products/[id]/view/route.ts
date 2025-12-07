// src/app/api/products/[id]/view/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ensure product exists before increment
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({
      success: true,
      viewCount: updated.viewCount,
    });
  } catch (error) {
    console.error("Error incrementing product view count:", error);
    return NextResponse.json(
      { error: "Failed to increment view count" },
      { status: 500 }
    );
  }
}
