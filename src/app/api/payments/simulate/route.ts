import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sendPaymentReceipt } from "@/src/lib/emailService";
import xenditService from "@/src/lib/xendit";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { purchaseId, status } = body;

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
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Try to call Xendit sandbox simulate endpoints when we have a transactionId
    if (purchase.transactionId) {
      if (purchase.paymentMethod === "BANK_TRANSFER") {
        await xenditService.simulateVirtualAccount(purchase.transactionId, purchase.totalAmount);
      } else if (purchase.paymentMethod === "QRIS") {
        await xenditService.simulateQRIS(purchase.transactionId, purchase.totalAmount);
      } else if (purchase.paymentMethod === "E_WALLET") {
        await xenditService.simulateEWallet(purchase.transactionId, status === "success" ? "SUCCEEDED" : "FAILED");
      } else {
        // Invoice/card
        await xenditService.simulateInvoice(purchase.transactionId, status === "success" ? "PAID" : "EXPIRED");
      }
    }

    if (status === 'success') {
      const transactionId = purchase.transactionId || `TXN-${Date.now()}`;
      
      const updatedPurchase = await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          paymentStatus: "COMPLETED",
          transactionId,
          completedAt: new Date(),
        },
      });

      const userProductsData = purchase.items.map(item => ({
        userId: purchase.userId,
        productId: item.productId,
        purchasedAt: new Date(),
      }));

      await prisma.userProduct.createMany({
        data: userProductsData,
        skipDuplicates: true,
      });

      await prisma.activityLog.create({
        data: {
          userId: purchase.userId,
          action: "PAYMENT_SUCCESS",
          details: {
            purchaseId,
            transactionId,
            totalAmount: purchase.totalAmount,
          },
        },
      });

      // Send email notification
      if (purchase.user.email) {
        try {
          await sendPaymentReceipt({
            to: purchase.user.email,
            userName: purchase.user.name || 'Customer',
            purchaseId,
            transactionId,
            items: purchase.items.map(item => ({
              title: item.product.title,
              price: item.priceAtPurchase,
              quantity: 1,
            })),
            totalAmount: purchase.totalAmount,
            paymentMethod: purchase.paymentMethod || 'E_WALLET',
            completedAt: updatedPurchase.completedAt!,
          });
        } catch (err) {
          console.error("Failed to send payment receipt email:", err);
        }
      }

      return NextResponse.json({
        success: true,
        purchase: updatedPurchase,
        message: "Payment successful",
      });
    } else {
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
          },
        },
      });

      return NextResponse.json({
        success: false,
        message: "Payment failed",
      });
    }

  } catch (error) {
    console.error("Error simulating payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
