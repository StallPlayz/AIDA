import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendPaymentReceipt } from "@/src/lib/emailService";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("Xendit callback received:", body);

    // Verify callback token
    const callbackToken = request.headers.get("x-callback-token");
    if (callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
      console.warn("Invalid callback token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let purchaseId: string | null = null;
    let status: string | null = null;

    // Handle different callback types
    if (body.external_id) {
      // Invoice or QRIS callback
      purchaseId = body.external_id;
      status = body.status;
    } else if (body.callback_virtual_account_id) {
      // Virtual Account callback
      purchaseId = body.external_id;
      status = body.payment_id ? "PAID" : "PENDING";
    } else if (body.data && body.data.reference_id) {
      // E-wallet callback
      purchaseId = body.data.reference_id;
      status = body.data.status;
    }

    if (!purchaseId) {
      console.error("Could not extract purchase ID from callback");
      return NextResponse.json(
        { error: "Invalid callback data" },
        { status: 400 }
      );
    }

    // Find the purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!purchase) {
      console.error("Purchase not found:", purchaseId);
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Update purchase based on status
    if (status === "PAID" || status === "SETTLED" || status === "SUCCEEDED") {
      // Payment successful
      const updatedPurchase = await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          paymentStatus: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Create user products
      const userProductsData = purchase.items.map((item) => ({
        userId: purchase.userId,
        productId: item.productId,
        purchasedAt: new Date(),
      }));

      await prisma.userProduct.createMany({
        data: userProductsData,
        skipDuplicates: true,
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: purchase.userId,
          action: "PAYMENT_SUCCESS",
          details: {
            purchaseId,
            transactionId: purchase.transactionId,
            totalAmount: purchase.totalAmount,
            xenditCallback: body,
          },
        },
      });

      // Send email notification
      if (purchase.user.email) {
        await sendPaymentReceipt({
          to: purchase.user.email,
          userName: purchase.user.name || "Customer",
          purchaseId,
          transactionId: purchase.transactionId || "N/A",
          items: purchase.items.map((item) => ({
            title: item.product.title,
            price: item.priceAtPurchase,
            quantity: 1,
          })),
          totalAmount: purchase.totalAmount,
          paymentMethod: purchase.paymentMethod || "E_WALLET",
          completedAt: updatedPurchase.completedAt!,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Payment completed successfully",
      });
    } else if (status === "FAILED" || status === "EXPIRED") {
      // Payment failed
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          paymentStatus: "FAILED",
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: purchase.userId,
          action: "PAYMENT_FAILED",
          details: {
            purchaseId,
            totalAmount: purchase.totalAmount,
            xenditCallback: body,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment failed",
      });
    }

    // For other statuses
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Xendit callback error:", error);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 }
    );
  }
}
