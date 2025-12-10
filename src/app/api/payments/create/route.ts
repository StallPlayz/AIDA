import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import xenditService from "@/src/lib/xendit";
import { checkCsrf, checkRateLimit } from "@/utils/security";
import { computeDiscountedPrice } from "@/utils/pricing";

type ProductItem = {
  id: string;
  price: number;
  status: string;
  title: string;
};

export async function POST(request: Request) {
  try {
    const csrf = checkCsrf(request);
    if (csrf) return csrf;

    const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 20, identifier: "payments_create" });
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
    const { items, paymentMethod, paymentType, username, whatsapp } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    if (!username || !whatsapp) {
      return NextResponse.json(
        { error: "Username and WhatsApp are required" },
        { status: 400 }
      );
    }

    // Get products
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: "ACTIVE",
      },
    }) as (ProductItem & { discountType?: "NONE" | "PERCENT" | "FIXED"; discountValue?: number })[];

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: "Some products are not available" },
        { status: 400 }
      );
    }

    // Calculate total
    let totalAmount = 0;
    const purchaseItemsData = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const { finalPrice } = computeDiscountedPrice(
        product.price,
        (product as any).discountType as any,
        (product as any).discountValue
      );
      totalAmount += finalPrice * (item.quantity || 1);
      return {
        productId: product.id,
        priceAtPurchase: finalPrice,
      };
    });

    // Create purchase in database first
    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        totalAmount,
        paymentMethod: paymentType || "E_WALLET",
        paymentStatus: "PENDING",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        items: {
          create: purchaseItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Prepare items for Xendit
    const xenditItems = purchase.items.map(item => ({
      name: item.product.title,
      quantity: 1,
      price: item.priceAtPurchase,
    }));

    let paymentData: any = null;

    // Create payment based on type
    if (paymentType === 'QRIS') {
      // Use hosted invoice flow like credit card
      const invoiceResult = await xenditService.createInvoice({
        externalId: `${purchase.id}-invoice`,
        amount: totalAmount,
        payerEmail: user.email,
        description: `Purchase ${purchase.id}`,
        items: xenditItems,
        paymentMethods: ['QRIS'],
      });

      if (!invoiceResult.success || !invoiceResult.data) {
        throw new Error(invoiceResult.error || 'Failed to create invoice');
      }

      paymentData = {
        type: 'INVOICE',
        invoiceUrl: invoiceResult.data.invoice_url || invoiceResult.data.invoiceUrl,
        expiryTime: invoiceResult.data.expiry_date
          ? new Date(invoiceResult.data.expiry_date)
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
        xenditId: invoiceResult.data.id,
        amount: totalAmount,
      };

    } else if (paymentType === 'BANK_TRANSFER') {
      // Create hosted invoice so user can open a payment page as well
      let bankInvoiceUrl: string | undefined;
      try {
        const invoiceResult = await xenditService.createInvoice({
          externalId: `${purchase.id}-invoice`,
          amount: totalAmount,
          payerEmail: user.email,
          description: `Purchase ${purchase.id}`,
          items: xenditItems,
        });

        if (invoiceResult.success && invoiceResult.data) {
          bankInvoiceUrl =
            invoiceResult.data.invoice_url || invoiceResult.data.invoiceUrl;
        } else {
          console.error('Bank Transfer invoice creation failed:', invoiceResult.error);
          throw new Error(invoiceResult.error || 'Failed to create bank invoice');
        }
      } catch (err) {
        console.error('Bank Transfer invoice creation error:', err);
        throw err;
      }

      const bankCodeMap: { [key: string]: string } = {
        'BCA': 'BCA',
        'MANDIRI': 'MANDIRI',
        'BNI': 'BNI',
        'BRI': 'BRI',
      };

      const bankCode = bankCodeMap[paymentMethod] || 'BCA';

      const vaResult = await xenditService.createVirtualAccount({
        externalId: purchase.id,
        bankCode: bankCode,
        name: user.name || username,
        amount: totalAmount,
      });

      if (!vaResult.success || !vaResult.data) {
        throw new Error(vaResult.error || 'Failed to create virtual account');
      }

      paymentData = {
        type: 'BANK_TRANSFER',
        bank: paymentMethod,
        accountNumber: vaResult.data.account_number,
        accountName: vaResult.data.name,
        amount: totalAmount,
        expiryTime: new Date(vaResult.data.expiration_date),
        xenditId: vaResult.data.id,
        invoiceUrl: bankInvoiceUrl,
      };

    } else if (paymentType === 'E_WALLET') {
      const ewalletMethodMap: Record<string, string> = {
        DANA: 'DANA',
        OVO: 'OVO',
        GOPAY: 'GOPAY',
        SHOPEEPAY: 'SHOPEEPAY',
      };
      const selectedEwallet = ewalletMethodMap[paymentMethod] || 'DANA';

      // Use hosted invoice flow similar to card (let Xendit decide available methods)
      const invoiceResult = await xenditService.createInvoice({
        externalId: `${purchase.id}-invoice`,
        amount: totalAmount,
        payerEmail: user.email,
        description: `Purchase ${purchase.id}`,
        items: xenditItems,
        paymentMethods: [selectedEwallet],
      });

      if (!invoiceResult.success || !invoiceResult.data) {
        console.error("E-WALLET invoice error:", invoiceResult.error);
        throw new Error(invoiceResult.error || 'Failed to create invoice');
      }

      paymentData = {
        type: 'INVOICE',
        invoiceUrl: invoiceResult.data.invoice_url || invoiceResult.data.invoiceUrl,
        expiryTime: invoiceResult.data.expiry_date
          ? new Date(invoiceResult.data.expiry_date)
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
        xenditId: invoiceResult.data.id,
        amount: totalAmount,
      };

    } else {
      // Default to hosted invoice (supports CARD and others in sandbox)
      const invoiceResult = await xenditService.createInvoice({
        externalId: purchase.id,
        amount: totalAmount,
        payerEmail: user.email,
        description: `Purchase ${purchase.id}`,
        items: xenditItems,
        paymentMethods: paymentType === "CARD" ? ["CARD"] : undefined,
      });

      if (!invoiceResult.success || !invoiceResult.data) {
        throw new Error(invoiceResult.error || 'Failed to create invoice');
      }

      paymentData = {
        type: paymentType === "CARD" ? "CARD" : "INVOICE",
        invoiceUrl: invoiceResult.data.invoice_url || invoiceResult.data.invoiceUrl,
        expiryTime: invoiceResult.data.expiry_date
          ? new Date(invoiceResult.data.expiry_date)
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
        xenditId: invoiceResult.data.id,
      };
    }

    // Update purchase with xendit ID and channel metadata
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        transactionId: paymentData.xenditId,
        paymentMethod: paymentType,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_INITIATED",
        details: {
          purchaseId: purchase.id,
          totalAmount,
          paymentMethod: paymentType,
          paymentProvider: paymentMethod,
          username,
          whatsapp,
          xenditId: paymentData.xenditId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      purchase,
      paymentData,
      message: "Payment initiated successfully",
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating payment:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create payment", 
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
