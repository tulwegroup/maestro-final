/**
 * Wio Bank API Service
 * 
 * Wio is a digital-first bank in UAE designed for fintech embedding.
 * Banking-as-a-Service positioning with APIs built for third-party apps.
 * 
 * Note: Wio Bank requires partnership/business account to access APIs
 * Visit: https://www.wio.ai/business for more information
 */

// API Configuration
const WIO_CONFIG = {
  sandbox: {
    baseUrl: 'https://api-sandbox.wio.ae',
  },
  production: {
    baseUrl: 'https://api.wio.ae',
  },
};

const USE_SANDBOX = process.env.WIO_USE_SANDBOX !== 'false';
const API_BASE = USE_SANDBOX ? WIO_CONFIG.sandbox.baseUrl : WIO_CONFIG.production.baseUrl;

// API Keys (to be configured after partnership registration)
const API_KEY = process.env.WIO_API_KEY || '';
const CLIENT_ID = process.env.WIO_CLIENT_ID || '';
const CLIENT_SECRET = process.env.WIO_CLIENT_SECRET || '';

// Types
export interface WioAccount {
  id: string;
  accountNumber: string;
  iban: string;
  accountType: 'BUSINESS' | 'PERSONAL';
  currency: string;
  balance: number;
  availableBalance: number;
  holdBalance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
}

export interface WioTransaction {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  merchantCategory?: string;
  bookingDate: string;
  valueDate: string;
  reference: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
  runningBalance?: number;
}

export interface WioBeneficiary {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  bankName: string;
  accountNumber: string;
  iban: string;
  country: string;
  currency: string;
  isVerified: boolean;
}

export interface WioTransferRequest {
  fromAccountId: string;
  toBeneficiaryId: string;
  amount: number;
  currency: string;
  purpose: string;
  reference: string;
  scheduledDate?: string;
}

export interface WioTransferResponse {
  transferId: string;
  status: string;
  reference: string;
  createdAt: string;
  estimatedArrival?: string;
}

export interface WioPaymentLinkRequest {
  amount: number;
  currency: string;
  description: string;
  merchantReference: string;
  expiryMinutes?: number;
  customerEmail?: string;
  customerPhone?: string;
}

export interface WioPaymentLinkResponse {
  linkId: string;
  paymentUrl: string;
  qrCode?: string;
  expiresAt: string;
}

export interface WioCard {
  id: string;
  cardType: 'VIRTUAL' | 'PHYSICAL';
  cardNumber: string; // Masked
  expiryDate: string;
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED';
  spendingLimit?: number;
  monthlySpent?: number;
}

export interface WioInvoiceRequest {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
  dueDate: string;
  notes?: string;
}

export interface WioInvoiceResponse {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  paymentUrl: string;
  createdAt: string;
}

/**
 * Check if Wio API is configured
 */
export function isConfigured(): boolean {
  return Boolean(API_KEY && CLIENT_ID);
}

/**
 * Get configuration status
 */
export function getConfigStatus() {
  return {
    configured: isConfigured(),
    environment: USE_SANDBOX ? 'sandbox' : 'production',
    hasApiKey: Boolean(API_KEY),
    hasClientId: Boolean(CLIENT_ID),
    hasClientSecret: Boolean(CLIENT_SECRET),
  };
}

/**
 * Get authentication headers
 */
function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-Client-ID': CLIENT_ID,
    'X-Client-Secret': CLIENT_SECRET,
  };
}

/**
 * Get accounts
 */
export async function getAccounts(): Promise<{ success: boolean; accounts?: WioAccount[]; error?: string }> {
  if (!isConfigured()) {
    return {
      success: false,
      error: 'Wio API not configured. Please set WIO_API_KEY and WIO_CLIENT_ID environment variables. Visit https://www.wio.ai/business to register.',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/accounts`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Wio API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, accounts: data.accounts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get account balance
 */
export async function getBalance(accountId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Wio API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/accounts/${accountId}/balance`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Wio API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, balance: data.balance };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get transactions
 */
export async function getTransactions(
  accountId: string,
  options?: { fromDate?: string; toDate?: string; limit?: number; offset?: number }
): Promise<{ success: boolean; transactions?: WioTransaction[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Wio API not configured' };
  }

  try {
    const params = new URLSearchParams();
    if (options?.fromDate) params.append('fromDate', options.fromDate);
    if (options?.toDate) params.append('toDate', options.toDate);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const url = `${API_BASE}/v1/accounts/${accountId}/transactions${params.toString() ? `?${params}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Wio API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, transactions: data.transactions };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get beneficiaries
 */
export async function getBeneficiaries(): Promise<{ success: boolean; beneficiaries?: WioBeneficiary[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Wio API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/beneficiaries`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Wio API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, beneficiaries: data.beneficiaries };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Make transfer
 */
export async function makeTransfer(
  transfer: WioTransferRequest
): Promise<{ success: boolean; response?: WioTransferResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Wio API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/transfers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(transfer),
    });

    if (!response.ok) {
      throw new Error(`Wio API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, response: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create payment link
 */
export async function createPaymentLink(
  request: WioPaymentLinkRequest
): Promise<{ success: boolean; response?: WioPaymentLinkResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Wio API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/payment-links`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Wio API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, response: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get cards
 */
export async function getCards(): Promise<{ success: boolean; cards?: WioCard[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Wio API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/cards`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Wio API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, cards: data.cards };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create invoice
 */
export async function createInvoice(
  request: WioInvoiceRequest
): Promise<{ success: boolean; response?: WioInvoiceResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Wio API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/invoices`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Wio API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, response: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mock data for development/testing
 */
export function getMockAccounts(): WioAccount[] {
  return [
    {
      id: 'WIO001',
      accountNumber: '1234567890',
      iban: 'AE380430000012345678901',
      accountType: 'BUSINESS',
      currency: 'AED',
      balance: 125000.00,
      availableBalance: 120000.00,
      holdBalance: 5000.00,
      status: 'ACTIVE',
      createdAt: '2024-01-15T00:00:00Z',
    },
  ];
}

export function getMockTransactions(): WioTransaction[] {
  return [
    {
      id: 'WIO_TXN001',
      accountId: 'WIO001',
      type: 'CREDIT',
      amount: 50000.00,
      currency: 'AED',
      description: 'Client Payment - Project Alpha',
      merchantName: 'Client Corp',
      bookingDate: new Date().toISOString(),
      valueDate: new Date().toISOString(),
      reference: 'WIO-REF-001',
      status: 'COMPLETED',
      runningBalance: 125000.00,
    },
    {
      id: 'WIO_TXN002',
      accountId: 'WIO001',
      type: 'DEBIT',
      amount: 3500.00,
      currency: 'AED',
      description: 'Office Supplies',
      merchantName: 'Office Depot',
      merchantCategory: 'OFFICE_SUPPLIES',
      bookingDate: new Date(Date.now() - 86400000).toISOString(),
      valueDate: new Date(Date.now() - 86400000).toISOString(),
      reference: 'WIO-REF-002',
      status: 'COMPLETED',
      runningBalance: 121500.00,
    },
  ];
}

export function getMockCards(): WioCard[] {
  return [
    {
      id: 'WIO_CARD001',
      cardType: 'VIRTUAL',
      cardNumber: 'XXXX-XXXX-XXXX-4589',
      expiryDate: '12/2028',
      status: 'ACTIVE',
      spendingLimit: 100000.00,
      monthlySpent: 25000.00,
    },
    {
      id: 'WIO_CARD002',
      cardType: 'PHYSICAL',
      cardNumber: 'XXXX-XXXX-XXXX-7823',
      expiryDate: '06/2027',
      status: 'ACTIVE',
      spendingLimit: 50000.00,
      monthlySpent: 8000.00,
    },
  ];
}

export type {
  WioAccount,
  WioTransaction,
  WioBeneficiary,
  WioTransferRequest,
  WioTransferResponse,
  WioPaymentLinkRequest,
  WioPaymentLinkResponse,
  WioCard,
  WioInvoiceRequest,
  WioInvoiceResponse,
};
