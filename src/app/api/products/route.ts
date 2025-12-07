// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { checkCsrf, checkRateLimit } from "@/utils/security";

// GET all active products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Create new product (Admin only)
export async function POST(request: Request) {
  try {
    const csrf = checkCsrf(request);
    if (csrf) return csrf;

    const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 30, identifier: "products_create" });
    if (rateLimited) return rateLimited;

    const session = await getServerSession(authOptions);
    
    console.log("Session:", session);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, email: true },
    });

    console.log("User found:", user);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);
    
    const {
      title,
      subtitle,
      description,
      price,
      category,
      thumbnailUrl,
      imageUrls,
      fileUrl,
      fileSize,
      tags,
      featured,
      discountType,
      discountValue,
    } = body;

    if (!title || !description || !price || !thumbnailUrl) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, price, and thumbnailUrl are required" },
        { status: 400 }
      );
    }

    const parsedPrice = parseInt(price);
    if (isNaN(parsedPrice)) {
      return NextResponse.json(
        { error: "Price must be a valid number" },
        { status: 400 }
      );
    }

    const normalizedDiscountType =
      discountType === "PERCENT" || discountType === "FIXED" ? discountType : "NONE";
    const parsedDiscountValue = parseInt(discountValue || 0);

    if (normalizedDiscountType === "PERCENT" && (parsedDiscountValue < 0 || parsedDiscountValue > 100)) {
      return NextResponse.json(
        { error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (normalizedDiscountType === "FIXED" && parsedDiscountValue < 0) {
      return NextResponse.json(
        { error: "Fixed discount must be zero or greater" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        title,
        subtitle: subtitle || null,
        description,
        price: parsedPrice,
        category: category || "LIGHTROOM_PRESET",
        status: "ACTIVE",
        thumbnailUrl,
        imageUrls: imageUrls || [],
        fileUrl: fileUrl || null,
        fileSize: fileSize ? parseInt(fileSize) : null,
        tags: tags || [],
        featured: !!featured,
        discountType: normalizedDiscountType,
        discountValue: isNaN(parsedDiscountValue) ? 0 : parsedDiscountValue,
      },
    });

    console.log("Product created:", product);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
