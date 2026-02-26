/**
 * Emirates NBD API Service
 * 
 * Emirates NBD Developer Portal: https://developer.emiratesnbd.com/
 * 
 * Available APIs:
 * - Accounts API (Balance, Transactions)
 * - Payments API (Domestic, International)
 * - Cards API (Card management)
 * - AANI Instant Payments
 * - Direct Debit
 * 
 * Note: Requires registration on developer portal to get API keys
 */

// API Configuration
const EMIRATES_NBD_CONFIG = {
  sandbox: {
    baseUrl: 'https://sandboxapi.emiratesnbd.com/neo/api/v1',
  },
  production: {
    baseUrl: 'https://api.emiratesnbd.com/neo/api/v1',
  },
};

const USE_SANDBOX = process.env.EMIRATES_NBD_USE_SANDBOX !== 'false';
const API_BASE = USE_SANDBOX ? EMIRATES_NBD_CONFIG.sandbox.baseUrl : EMIRATES_NBD_CONFIG.production.baseUrl;

// API Keys (to be configured after registration)
const API_KEY = process.env.EMIRATES_NBD_API_KEY || '';
const CLIENT_ID = process.env.EMIRATES_NBD_CLIENT_ID || '';
const CLIENT_SECRET = process.env.EMIRATES_NBD_CLIENT_SECRET || '';
const ACCESS_TOKEN = process.env.EMIRATES_NBD_ACCESS_TOKEN || '';

// Types
export interface EmiratesNBDAccount {
  id: string;
  accountNumber: string;
  iban: string;
  accountType: string;
  currency: string;
  balance: number;
  availableBalance: number;
  status: string;
  productName?: string;
  openingDate?: string;
}

export interface EmiratesNBDTransaction {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  category?: string;
  bookingDate: string;
  valueDate?: string;
  reference: string;
  status: string;
  runningBalance?: number;
}

export interface EmiratesNBDCard {
  cardId: string;
  cardNumber: string;
  cardType: string;
  cardBrand: string;
  expiryDate: string;
  status: string;
  creditLimit?: number;
  availableCredit?: number;
  outstandingBalance?: number;
}

export interface EmiratesNBDBeneficiary {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  country: string;
  currency: string;
  beneficiaryType: 'DOMESTIC' | 'INTERNATIONAL';
  isVerified: boolean;
}

export interface EmiratesNBDPaymentRequest {
  fromAccountId: string;
  toAccountId?: string;
  toIban?: string;
  beneficiaryId?: string;
  amount: number;
  currency: string;
  purpose: string;
  reference: string;
  paymentType: 'INSTANT' | 'SAME_DAY' | 'STANDARD';
}

export interface EmiratesNBDPaymentResponse {
  paymentId: string;
  status: string;
  reference: string;
  timestamp: string;
}

export interface EmiratesNBDAANIPayment {
  fromAccountId: string;
  toAlias: string; // Phone number or AANI ID
  amount: number;
  currency: string;
  purpose: string;
  reference: string;
}

/**
 * Check if Emirates NBD API is configured
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
    hasAccessToken: Boolean(ACCESS_TOKEN),
  };
}

/**
 * Get authentication headers
 */
function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'X-API-Key': API_KEY,
    'X-Client-ID': CLIENT_ID,
    'X-Client-Secret': CLIENT_SECRET,
  };
}

/**
 * Get OAuth token
 */
export async function getAccessToken(): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'accounts payments cards',
      }),
    });

    if (!response.ok) {
      throw new Error(`Emirates NBD OAuth error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, token: data.access_token };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get accounts
 */
export async function getAccounts(): Promise<{ success: boolean; accounts?: EmiratesNBDAccount[]; error?: string }> {
  if (!isConfigured()) {
    return {
      success: false,
      error: 'Emirates NBD API not configured. Please set EMIRATES_NBD_API_KEY and EMIRATES_NBD_CLIENT_ID environment variables.',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/accounts`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Emirates NBD API error: ${response.status}`);
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
export async function getAccountBalance(accountId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Emirates NBD API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/accounts/${accountId}/balance`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Emirates NBD API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, balance: data.availableBalance };
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
  fromDate?: string,
  toDate?: string,
  limit?: number
): Promise<{ success: boolean; transactions?: EmiratesNBDTransaction[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Emirates NBD API not configured' };
  }

  try {
    let url = `${API_BASE}/accounts/${accountId}/transactions`;
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (limit) params.append('limit', String(limit));
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Emirates NBD API error: ${response.status}`);
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
 * Get cards
 */
export async function getCards(): Promise<{ success: boolean; cards?: EmiratesNBDCard[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Emirates NBD API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/cards`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Emirates NBD API error: ${response.status}`);
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
 * Get beneficiaries
 */
export async function getBeneficiaries(): Promise<{ success: boolean; beneficiaries?: EmiratesNBDBeneficiary[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Emirates NBD API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/beneficiaries`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Emirates NBD API error: ${response.status}`);
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
 * Make payment
 */
export async function makePayment(
  payment: EmiratesNBDPaymentRequest
): Promise<{ success: boolean; response?: EmiratesNBDPaymentResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Emirates NBD API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      throw new Error(`Emirates NBD API error: ${response.status}`);
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
 * AANI Instant Payment
 */
export async function aaniPayment(
  payment: EmiratesNBDAANIPayment
): Promise<{ success: boolean; response?: EmiratesNBDPaymentResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Emirates NBD API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/payments/aani`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      throw new Error(`Emirates NBD API error: ${response.status}`);
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
 * Mock data for development/testing when API not configured
 */
export function getMockAccounts(): EmiratesNBDAccount[] {
  return [
    {
      id: 'ENBD001',
      accountNumber: 'XXXX1234',
      iban: 'AE020260000000123456789',
      accountType: 'Current',
      currency: 'AED',
      balance: 45000.00,
      availableBalance: 44500.00,
      status: 'Active',
      productName: 'Premier Current Account',
    },
    {
      id: 'ENBD002',
      accountNumber: 'XXXX5678',
      iban: 'AE020260000000987654321',
      accountType: 'Savings',
      currency: 'AED',
      balance: 120000.00,
      availableBalance: 120000.00,
      status: 'Active',
      productName: 'Premium Savings Account',
    },
  ];
}

export function getMockTransactions(): EmiratesNBDTransaction[] {
  return [
    {
      id: 'TXN001',
      accountId: 'ENBD001',
      type: 'DEBIT',
      amount: 850.00,
      currency: 'AED',
      description: 'Carrefour - Mall of Emirates',
      merchantName: 'Carrefour',
      category: 'Groceries',
      bookingDate: new Date().toISOString(),
      reference: 'POS-2026-001234',
      status: 'COMPLETED',
      runningBalance: 44150.00,
    },
    {
      id: 'TXN002',
      accountId: 'ENBD001',
      type: 'CREDIT',
      amount: 25000.00,
      currency: 'AED',
      description: 'Salary - ABC Corporation',
      merchantName: 'ABC Corporation',
      category: 'Income',
      bookingDate: new Date(Date.now() - 86400000).toISOString(),
      reference: 'SALARY-2026-02',
      status: 'COMPLETED',
      runningBalance: 69150.00,
    },
    {
      id: 'TXN003',
      accountId: 'ENBD001',
      type: 'DEBIT',
      amount: 3500.00,
      currency: 'AED',
      description: 'Emirates Airlines - Flight Booking',
      merchantName: 'Emirates Airlines',
      category: 'Travel',
      bookingDate: new Date(Date.now() - 172800000).toISOString(),
      reference: 'EMA-2026-789012',
      status: 'COMPLETED',
      runningBalance: 65650.00,
    },
  ];
}

export function getMockCards(): EmiratesNBDCard[] {
  return [
    {
      cardId: 'CRD001',
      cardNumber: 'XXXX-XXXX-XXXX-4532',
      cardType: 'Credit',
      cardBrand: 'Visa',
      expiryDate: '12/2027',
      status: 'Active',
      creditLimit: 50000.00,
      availableCredit: 42000.00,
      outstandingBalance: 8000.00,
    },
    {
      cardId: 'CRD002',
      cardNumber: 'XXXX-XXXX-XXXX-8901',
      cardType: 'Debit',
      cardBrand: 'Mastercard',
      expiryDate: '06/2026',
      status: 'Active',
    },
  ];
}

export type {
  EmiratesNBDAccount,
  EmiratesNBDTransaction,
  EmiratesNBDCard,
  EmiratesNBDBeneficiary,
  EmiratesNBDPaymentRequest,
  EmiratesNBDPaymentResponse,
  EmiratesNBDAANIPayment,
};
