// src/lib/xendit.ts
// Fixed version with correct Xendit API endpoints and parameters

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const XENDIT_API_URL = 'https://api.xendit.co';
// Centralize app URL so callback/redirect URLs are always valid
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

const xenditHeaders = {
  'Authorization': `Basic ${Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')}`,
  'Content-Type': 'application/json',
};

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  paymentMethods?: string[];
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
}

export interface CreateQRISParams {
  externalId: string;
  amount: number;
  callbackUrl?: string;
}

export interface CreateVAParams {
  externalId: string;
  bankCode: string;
  name: string;
  amount: number;
}

export const xenditService = {
  // Create Invoice (supports multiple payment methods)
  async createInvoice(params: CreateInvoiceParams) {
    try {
      const response = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
        method: 'POST',
        headers: xenditHeaders,
        body: JSON.stringify({
          external_id: params.externalId,
          amount: params.amount,
          payer_email: params.payerEmail,
          description: params.description,
          invoice_duration: 86400,
          success_redirect_url: params.successRedirectUrl || `${APP_URL}/payment/success`,
          failure_redirect_url: params.failureRedirectUrl || `${APP_URL}/payment/failed`,
          currency: 'IDR',
          items: params.items,
          should_send_email: false,
          payment_methods: params.paymentMethods,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Xendit invoice error:', error);
        throw new Error(error.message || 'Failed to create invoice');
      }

      const result = await response.json();

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Xendit create invoice error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create invoice',
      };
    }
  },

  async simulateInvoice(invoiceId: string, status: 'PAID' | 'EXPIRED' = 'PAID') {
    try {
      const response = await fetch(`${XENDIT_API_URL}/v2/invoices/${invoiceId}/simulate`, {
        method: 'POST',
        headers: xenditHeaders,
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to simulate invoice');
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to simulate invoice' };
    }
  },

  // Create QRIS Payment - FIXED VERSION
  async createQRIS(params: CreateQRISParams) {
    try {
      // Ensure amount is an integer
      const amount = Math.round(params.amount);
      
      const requestBody = {
        external_id: params.externalId,
        type: 'DYNAMIC',
        callback_url: params.callbackUrl || `${APP_URL}/api/payments/xendit-callback`,
        amount: amount.toString(), // Xendit expects string for QRIS
      };

      const response = await fetch(`${XENDIT_API_URL}/qr_codes`, {
        method: 'POST',
        headers: xenditHeaders,
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch {
          error = { message: responseText };
        }
        console.error('Xendit QRIS error:', error);
        throw new Error(JSON.stringify(error));
      }

      const result = JSON.parse(responseText);

      return {
        success: true,
        data: {
          id: result.id,
          qr_string: result.qr_string,
          status: result.status,
          amount: result.amount,
        },
      };
    } catch (error: any) {
      console.error('Xendit create QRIS error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create QRIS',
      };
    }
  },

  async simulateQRIS(qrId: string, amount: number) {
    try {
      const response = await fetch(`${XENDIT_API_URL}/qr_codes/${qrId}/payments`, {
        method: 'POST',
        headers: xenditHeaders,
        body: JSON.stringify({ reference_id: `sim-${qrId}`, amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to simulate QRIS');
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to simulate QRIS' };
    }
  },

  // Create Virtual Account (Bank Transfer)
  async createVirtualAccount(params: CreateVAParams) {
    try {
      const response = await fetch(`${XENDIT_API_URL}/callback_virtual_accounts`, {
        method: 'POST',
        headers: xenditHeaders,
        body: JSON.stringify({
          external_id: params.externalId,
          bank_code: params.bankCode,
          name: params.name,
          expected_amount: params.amount,
          is_closed: true,
          expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Xendit VA error:', error);
        throw new Error(error.message || 'Failed to create virtual account');
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          id: result.id,
          account_number: result.account_number,
          name: result.name,
          bank_code: result.bank_code,
          expiration_date: result.expiration_date,
        },
      };
    } catch (error: any) {
      console.error('Xendit create VA error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create virtual account',
      };
    }
  },

  async simulateVirtualAccount(vaId: string, amount: number) {
    try {
      const response = await fetch(`${XENDIT_API_URL}/callback_virtual_accounts/${vaId}/simulate_payment`, {
        method: 'POST',
        headers: xenditHeaders,
        body: JSON.stringify({
          amount,
          payment_method: 'BANK_TRANSFER',
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to simulate VA payment');
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to simulate VA payment' };
    }
  },

  // Create E-Wallet Payment - FIXED VERSION
  async createEWallet(params: {
    externalId: string;
    amount: number;
    phone: string;
    ewalletType: 'OVO' | 'DANA' | 'GOPAY' | 'SHOPEEPAY' | 'LINKAJA';
  }) {
    try {
      // Ensure amount is an integer (no decimals)
      const amount = Math.round(params.amount);
      
      // Correct channel codes for Indonesian e-wallets
      const channelCodeMap: Record<string, string> = {
        'OVO': 'ID_OVO',
        'DANA': 'ID_DANA',
        'LINKAJA': 'ID_LINKAJA',
        'SHOPEEPAY': 'ID_SHOPEEPAY',
        'GOPAY': 'ID_GOPAY',
      };

      // Format phone number - remove any spaces, dashes, or leading zeros
      let formattedPhone = params.phone.replace(/[\s-]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+62' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+62' + formattedPhone;
      }

      const requestBody: any = {
        reference_id: params.externalId,
        currency: 'IDR',
        amount: amount, // Use integer amount
        checkout_method: 'ONE_TIME_PAYMENT',
        channel_code: channelCodeMap[params.ewalletType],
        channel_properties: {
          success_redirect_url: `${APP_URL}/payment/success`,
          failure_redirect_url: `${APP_URL}/payment/failed`,
        },
        callback_url: `${APP_URL}/api/payments/xendit-callback`,
      };

      // Add mobile number for all e-wallets (Xendit requires it)
      requestBody.channel_properties.mobile_number = formattedPhone;

      const response = await fetch(`${XENDIT_API_URL}/ewallets/charges`, {
        method: 'POST',
        headers: xenditHeaders,
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch {
          error = { message: responseText };
        }
        console.error('Xendit e-wallet error:', error);
        // Return detailed error message
        const errorMsg = error.message || error.error_code || JSON.stringify(error);
        throw new Error(errorMsg);
      }

      const result = JSON.parse(responseText);

      return {
        success: true,
        data: {
          id: result.id,
          status: result.status,
          actions: result.actions,
          channel_code: result.channel_code,
        },
      };
    } catch (error: any) {
      console.error('Xendit create e-wallet error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create e-wallet payment',
      };
    }
  },

  async simulateEWallet(chargeId: string, status: 'SUCCEEDED' | 'FAILED' = 'SUCCEEDED') {
    try {
      const response = await fetch(`${XENDIT_API_URL}/ewallets/charges/${chargeId}/simulate`, {
        method: 'POST',
        headers: xenditHeaders,
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to simulate e-wallet charge');
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to simulate e-wallet charge' };
    }
  },

  // Get Invoice Status
  async getInvoice(invoiceId: string) {
    try {
      const response = await fetch(`${XENDIT_API_URL}/v2/invoices/${invoiceId}`, {
        method: 'GET',
        headers: xenditHeaders,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Xendit get invoice error:', error);
        throw new Error(error.message || 'Failed to get invoice');
      }

      const result = await response.json();

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Xendit get invoice error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get invoice',
      };
    }
  },
};

export default xenditService;
