/**
 * Mashreq Bank API Service
 * 
 * Mashreq API Marketplace: https://developer.mashreq.com/apihub/sandbox
 * 
 * Features:
 * - Payment APIs
 * - Real-time transfers
 * - Instant payments integrated with AANI
 * - Account information
 * - Cards API
 * 
 * Note: Requires registration on developer portal to get API keys
 */

// API Configuration
const MASHREQ_CONFIG = {
  sandbox: {
    baseUrl: 'https://developer.mashreq.com/apihub/sandbox',
  },
  production: {
    baseUrl: 'https://api.mashreq.com',
  },
};

const USE_SANDBOX = process.env.MASHREQ_USE_SANDBOX !== 'false';
const API_BASE = USE_SANDBOX ? MASHREQ_CONFIG.sandbox.baseUrl : MASHREQ_CONFIG.production.baseUrl;

// API Keys (to be configured after registration)
const API_KEY = process.env.MASHREQ_API_KEY || '';
const CLIENT_ID = process.env.MASHREQ_CLIENT_ID || '';
const CLIENT_SECRET = process.env.MASHREQ_CLIENT_SECRET || '';

// Types
export interface MashreqAccount {
  id: string;
  accountNumber: string;
  accountType: 'CURRENT' | 'SAVINGS' | 'CREDIT';
  currency: string;
  balance: number;
  availableBalance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FROZEN';
  iban: string;
}

export interface MashreqTransaction {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  bookingDate: string;
  valueDate: string;
  reference: string;
  category?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface MashreqPaymentRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  purpose: string;
  reference: string;
  paymentType: 'INSTANT' | 'SAME_DAY' | 'STANDARD';
}

export interface MashreqPaymentResponse {
  paymentId: string;
  status: string;
  reference: string;
  createdAt: string;
}

export interface MashreqAANIPaymentRequest {
  fromIban: string;
  toIban: string;
  amount: number;
  currency: string;
  purpose: string;
  reference: string;
}

export interface MashreqCard {
  cardId: string;
  cardType: 'CREDIT' | 'DEBIT' | 'PREPAID';
  cardNumber: string; // Masked
  expiryDate: string;
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED';
  creditLimit?: number;
  availableLimit?: number;
  currentBalance?: number;
}

export interface MashreqCardTransaction {
  transactionId: string;
  cardId: string;
  merchantName: string;
  merchantCategory: string;
  amount: number;
  currency: string;
  transactionDate: string;
  postingDate?: string;
  status: 'AUTHORIZED' | 'SETTLED' | 'DECLINED' | 'REVERSED';
}

/**
 * Check if Mashreq API is configured
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
export async function getAccounts(): Promise<{ success: boolean; accounts?: MashreqAccount[]; error?: string }> {
  if (!isConfigured()) {
    return {
      success: false,
      error: 'Mashreq API not configured. Please set MASHREQ_API_KEY and MASHREQ_CLIENT_ID environment variables.',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/accounts`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Mashreq API error: ${response.status}`);
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
 * Get account details
 */
export async function getAccountDetails(accountId: string): Promise<{ success: boolean; account?: MashreqAccount; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Mashreq API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/accounts/${accountId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Mashreq API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, account: data };
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
  options?: { fromDate?: string; toDate?: string; limit?: number }
): Promise<{ success: boolean; transactions?: MashreqTransaction[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Mashreq API not configured' };
  }

  try {
    const params = new URLSearchParams();
    if (options?.fromDate) params.append('fromDate', options.fromDate);
    if (options?.toDate) params.append('toDate', options.toDate);
    if (options?.limit) params.append('limit', String(options.limit));

    const url = `${API_BASE}/accounts/${accountId}/transactions${params.toString() ? `?${params}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Mashreq API error: ${response.status}`);
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
 * Make payment
 */
export async function makePayment(
  payment: MashreqPaymentRequest
): Promise<{ success: boolean; response?: MashreqPaymentResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Mashreq API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      throw new Error(`Mashreq API error: ${response.status}`);
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
 * Make instant payment via AANI (UAE Instant Payment Platform)
 */
export async function makeAANIPayment(
  payment: MashreqAANIPaymentRequest
): Promise<{ success: boolean; response?: MashreqPaymentResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Mashreq API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/payments/aani`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      throw new Error(`Mashreq API error: ${response.status}`);
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
export async function getCards(): Promise<{ success: boolean; cards?: MashreqCard[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Mashreq API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/cards`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Mashreq API error: ${response.status}`);
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
 * Get card transactions
 */
export async function getCardTransactions(
  cardId: string,
  options?: { fromDate?: string; toDate?: string }
): Promise<{ success: boolean; transactions?: MashreqCardTransaction[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Mashreq API not configured' };
  }

  try {
    const params = new URLSearchParams();
    if (options?.fromDate) params.append('fromDate', options.fromDate);
    if (options?.toDate) params.append('toDate', options.toDate);

    const url = `${API_BASE}/cards/${cardId}/transactions${params.toString() ? `?${params}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Mashreq API error: ${response.status}`);
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
 * Mock data for development/testing
 */
export function getMockAccounts(): MashreqAccount[] {
  return [
    {
      id: 'MASHREQ001',
      accountNumber: 'AE070330000012345678901',
      accountType: 'CURRENT',
      currency: 'AED',
      balance: 75000.00,
      availableBalance: 74000.00,
      status: 'ACTIVE',
      iban: 'AE070330000012345678901',
    },
    {
      id: 'MASHREQ002',
      accountNumber: 'AE070330000098765432109',
      accountType: 'SAVINGS',
      currency: 'AED',
      balance: 250000.00,
      availableBalance: 250000.00,
      status: 'ACTIVE',
      iban: 'AE070330000098765432109',
    },
  ];
}

export function getMockCards(): MashreqCard[] {
  return [
    {
      cardId: 'CARD001',
      cardType: 'CREDIT',
      cardNumber: 'XXXX-XXXX-XXXX-4532',
      expiryDate: '12/2028',
      status: 'ACTIVE',
      creditLimit: 50000.00,
      availableLimit: 35000.00,
      currentBalance: 15000.00,
    },
    {
      cardId: 'CARD002',
      cardType: 'DEBIT',
      cardNumber: 'XXXX-XXXX-XXXX-7891',
      expiryDate: '06/2027',
      status: 'ACTIVE',
    },
  ];
}

export function getMockTransactions(): MashreqTransaction[] {
  return [
    {
      id: 'MASHREQ_TXN001',
      accountId: 'MASHREQ001',
      type: 'DEBIT',
      amount: 1200.00,
      currency: 'AED',
      description: 'RTA Salik Toll Recharge',
      bookingDate: new Date().toISOString(),
      valueDate: new Date().toISOString(),
      reference: 'SALIK-REF-001',
      category: 'TRANSPORT',
      status: 'COMPLETED',
    },
    {
      id: 'MASHREQ_TXN002',
      accountId: 'MASHREQ001',
      type: 'CREDIT',
      amount: 35000.00,
      currency: 'AED',
      description: 'Salary Credit - ABC Company',
      bookingDate: new Date(Date.now() - 86400000).toISOString(),
      valueDate: new Date(Date.now() - 86400000).toISOString(),
      reference: 'SALARY-FEB-2026',
      category: 'INCOME',
      status: 'COMPLETED',
    },
    {
      id: 'MASHREQ_TXN003',
      accountId: 'MASHREQ001',
      type: 'DEBIT',
      amount: 450.00,
      currency: 'AED',
      description: 'DEWA Bill Payment',
      bookingDate: new Date(Date.now() - 172800000).toISOString(),
      valueDate: new Date(Date.now() - 172800000).toISOString(),
      reference: 'DEWA-FEB-2026',
      category: 'UTILITIES',
      status: 'COMPLETED',
    },
  ];
}

export type {
  MashreqAccount,
  MashreqTransaction,
  MashreqPaymentRequest,
  MashreqPaymentResponse,
  MashreqAANIPaymentRequest,
  MashreqCard,
  MashreqCardTransaction,
};
