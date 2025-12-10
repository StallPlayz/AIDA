// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { checkCsrf, checkRateLimit } from "@/utils/security";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const extractProductImagePath = (url: string | null) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const idx = segments.findIndex((s) => s === "product-images");
    if (idx === -1) return null;
    const pathParts = segments.slice(idx + 1);
    return pathParts.length ? pathParts.join("/") : null;
  } catch {
    return null;
  }
};

// GET single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT - Update product (Admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = checkCsrf(request);
    if (csrf) return csrf;

    const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 40, identifier: "products_update" });
    if (rateLimited) return rateLimited;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.price || !body.thumbnailUrl) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, price, and thumbnailUrl" },
        { status: 400 }
      );
    }

    // Parse price
    const parsedPrice = typeof body.price === 'string' ? parseInt(body.price) : body.price;
    if (isNaN(parsedPrice)) {
      return NextResponse.json(
        { error: "Price must be a valid number" },
        { status: 400 }
      );
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        subtitle: body.subtitle || null,
        description: body.description,
        price: parsedPrice,
        category: body.category || "LIGHTROOM_PRESET",
        status: body.status || "ACTIVE",
        thumbnailUrl: body.thumbnailUrl,
        imageUrls: body.imageUrls || [],
        fileUrl: body.fileUrl || null,
        fileSize: body.fileSize ? parseInt(body.fileSize) : null,
        tags: body.tags || [],
        featured: !!body.featured,
        discountType:
          body.discountType === "PERCENT" || body.discountType === "FIXED"
            ? body.discountType
            : "NONE",
        discountValue: Number.isFinite(Number(body.discountValue))
          ? Math.max(0, parseInt(body.discountValue))
          : 0,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = checkCsrf(request);
    if (csrf) return csrf;

    const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 20, identifier: "products_delete" });
    if (rateLimited) return rateLimited;

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Check if product has been purchased
    const purchaseCount = await prisma.purchaseItem.count({
      where: { productId: id },
    });

    if (purchaseCount > 0) {
      // Product has been purchased - archive it instead of deleting
      await prisma.product.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Product archived successfully (has purchase history)",
        archived: true 
      });
    } else {
      // Product has never been purchased - safe to delete
      let imageDeleted = false;

      if (!supabase) {
        console.warn("Supabase client not configured; skipping image delete");
      }

      if (supabase && product.thumbnailUrl) {
        const storagePath = extractProductImagePath(product.thumbnailUrl);
        if (storagePath) {
          const { error: removeError } = await supabase.storage
            .from("product-images")
            .remove([storagePath]);
          if (removeError) {
            console.error("Failed to delete product image from storage:", removeError);
          } else {
            imageDeleted = true;
          }
        } else {
          console.warn("Could not parse storage path from thumbnailUrl");
        }
      }

      await prisma.product.delete({
        where: { id },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Product deleted successfully",
        archived: false,
        imageDeleted,
      });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
