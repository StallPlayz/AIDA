import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { checkCsrf, checkRateLimit } from "@/utils/security";

// GET user's cart
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: true,
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(request: Request) {
  try {
    const csrf = checkCsrf(request);
    if (csrf) return csrf;
    const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 60, identifier: "cart_post" });
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: "Product not found or not available" },
        { status: 404 }
      );
    }

    // Check if already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { message: "Item already in cart", cartItem: existingItem },
        { status: 200 }
      );
    }

    // Add to cart
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: productId,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

// DELETE - Clear cart
export async function DELETE(request: Request) {
  try {
    const csrf = checkCsrf(request);
    if (csrf) return csrf;

    const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 30, identifier: "cart_clear" });
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}

// DELETE - Remove specific item from cart
export async function DELETE_ITEM(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await params;

    await prisma.cartItem.delete({
      where: {
        id: id,
        userId: user.id, // Ensure user owns this cart item
      },
    });

    return NextResponse.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
