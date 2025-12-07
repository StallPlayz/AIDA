import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { purchaseId } = await request.json();
    if (!purchaseId) {
      return NextResponse.json(
        { error: "purchaseId is required" },
        { status: 400 }
      );
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { user: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.user.email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If already completed, do not overwrite
    if (purchase.paymentStatus === "COMPLETED") {
      return NextResponse.json({ success: true, status: purchase.paymentStatus });
    }

    const updated = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        paymentStatus: "REFUNDED",
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: purchase.userId,
        action: "PAYMENT_CANCELED",
        details: {
          purchaseId,
          previousStatus: purchase.paymentStatus,
        },
      },
    });

    return NextResponse.json({ success: true, status: updated.paymentStatus });
  } catch (error) {
    console.error("Error canceling payment:", error);
    return NextResponse.json(
      { error: "Failed to cancel payment" },
      { status: 500 }
    );
  }
}
