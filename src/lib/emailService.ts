// src/lib/emailService.ts
import nodemailer from 'nodemailer';

// Create transporter (you'll need to configure this with your email service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendPaymentReceiptParams {
  to: string;
  userName: string;
  purchaseId: string;
  transactionId: string;
  items: Array<{
    title: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  completedAt: Date;
}

interface SendVerificationEmailParams {
  to: string;
  name: string;
  token: string;
  expires: Date;
}

export async function sendPaymentReceipt({
  to,
  userName,
  purchaseId,
  transactionId,
  items,
  totalAmount,
  paymentMethod,
  completedAt,
}: SendPaymentReceiptParams) {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.title}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">IDR ${item.price.toLocaleString()}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">IDR ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - AIDA Creative</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #246E76, #2EB9B9); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Payment Successful!</h1>
              <p style="margin: 12px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Thank you for your purchase</p>
            </td>
          </tr>

          <!-- Success Icon -->
          <tr>
            <td align="center" style="padding: 30px 40px 20px;">
              <table align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="display: inline-block; font-size: 48px; color: #ffffff; line-height: 80px;">✓</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 18px; color: #111827;">Hi ${userName},</p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                Your payment has been processed successfully. Your purchased products are now available in your library.
              </p>
            </td>
          </tr>

          <!-- Transaction Details -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #374151;">Transaction ID:</strong>
                    <span style="color: #6b7280; float: right;">${transactionId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #374151;">Purchase ID:</strong>
                    <span style="color: #6b7280; float: right;">${purchaseId.slice(0, 12)}...</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #374151;">Payment Method:</strong>
                    <span style="color: #6b7280; float: right;">${paymentMethod}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #374151;">Date:</strong>
                    <span style="color: #6b7280; float: right;">${new Date(completedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Order Summary</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600;">Product</th>
                    <th style="padding: 12px; text-align: center; font-size: 14px; color: #6b7280; font-weight: 600;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 14px; color: #6b7280; font-weight: 600;">Price</th>
                    <th style="padding: 12px; text-align: right; font-size: 14px; color: #6b7280; font-weight: 600;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr style="background-color: #f9fafb;">
                    <td colspan="3" style="padding: 16px; text-align: right; font-weight: 700; font-size: 18px; color: #111827;">Total:</td>
                    <td style="padding: 16px; text-align: right; font-weight: 700; font-size: 18px; color: #246E76;">IDR ${totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 40px 40px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/owned-products" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #246E76, #2EB9B9); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 18px; font-weight: 600;">
                View My Products
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280; text-align: center;">
                Need help? Contact us at <a href="mailto:support@aidacreative.id" style="color: #246E76; text-decoration: none;">support@aidacreative.id</a>
              </p>
              <p style="margin: 0; font-size: 14px; color: #9ca3af; text-align: center;">
                © 2025 AIDA Creative. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"AIDA Creative" <${process.env.SMTP_USER}>`,
      to,
      subject: `Payment Receipt - Order ${transactionId}`,
      html: htmlContent,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail({ to, name, token, expires }: SendVerificationEmailParams) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f2024; color: #e5e7eb; border-radius: 12px;">
      <h2 style="margin-top: 0; color: #2eb9b9;">Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Use the code below to verify your account. It expires at ${expires.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
      <div style="margin: 18px 0; padding: 14px 16px; background: #123036; color: #fff; font-size: 20px; letter-spacing: 3px; text-align: center; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);">
        ${token}
      </div>
      <p style="color: #9ca3af;">If you did not request this, you can ignore this email.</p>
      <p style="color: #9ca3af;">— AIDA Creative</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"AIDA Creative" <${process.env.SMTP_USER}>`,
    to,
    subject: "Verify your email",
    html,
  });
}
