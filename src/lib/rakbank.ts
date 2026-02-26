/**
 * RAKBANK API Service
 * 
 * RAKBANK Developer Portal: https://developer.rakbank.ae/sb/api
 * 
 * Available APIs:
 * - Digital Banking Beneficiaries API
 * - Partner Beneficiary Management API
 * - Partner RAKMoneyTransfer API
 * - Card Payments API
 * - OTP Request API
 * 
 * Note: Requires registration on developer portal to get API keys
 */

// API Configuration
const RAKBANK_CONFIG = {
  sandbox: {
    baseUrl: 'https://developer.rakbank.ae/sb/api',
    // Sandbox endpoints - requires registration
  },
  production: {
    baseUrl: 'https://api.rakbank.ae',
  },
};

const USE_SANDBOX = process.env.RAKBANK_USE_SANDBOX !== 'false';
const API_BASE = USE_SANDBOX ? RAKBANK_CONFIG.sandbox.baseUrl : RAKBANK_CONFIG.production.baseUrl;

// API Keys (to be configured after registration)
const API_KEY = process.env.RAKBANK_API_KEY || '';
const CLIENT_ID = process.env.RAKBANK_CLIENT_ID || '';
const CLIENT_SECRET = process.env.RAKBANK_CLIENT_SECRET || '';

// Types
export interface RakbankAccount {
  accountId: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  balance: number;
  availableBalance: number;
  status: string;
}

export interface RakbankTransaction {
  transactionId: string;
  accountId: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  reference: string;
  status: string;
}

export interface RakbankBeneficiary {
  beneficiaryId: string;
  name: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  country: string;
  currency: string;
}

export interface RakbankTransferRequest {
  fromAccountId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  reference: string;
  purpose?: string;
}

export interface RakbankTransferResponse {
  transactionId: string;
  status: string;
  reference: string;
  message: string;
}

export interface RakbankCardPaymentRequest {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  amount: number;
  currency: string;
  merchantId: string;
  merchantReference: string;
}

export interface RakbankOTPRequest {
  mobileNumber: string;
  purpose: string;
}

export interface RakbankOTPVerify {
  mobileNumber: string;
  otp: string;
  purpose: string;
}

/**
 * Check if RAKBANK API is configured
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
 * Fetch accounts (requires API key)
 */
export async function getAccounts(): Promise<{ success: boolean; accounts?: RakbankAccount[]; error?: string }> {
  if (!isConfigured()) {
    return {
      success: false,
      error: 'RAKBANK API not configured. Please set RAKBANK_API_KEY and RAKBANK_CLIENT_ID environment variables.',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/accounts`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
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
    return { success: false, error: 'RAKBANK API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/accounts/${accountId}/balance`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
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
  fromDate?: string,
  toDate?: string
): Promise<{ success: boolean; transactions?: RakbankTransaction[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'RAKBANK API not configured' };
  }

  try {
    let url = `${API_BASE}/accounts/${accountId}/transactions`;
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
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
export async function getBeneficiaries(): Promise<{ success: boolean; beneficiaries?: RakbankBeneficiary[]; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'RAKBANK API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/beneficiaries`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
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
 * Add beneficiary
 */
export async function addBeneficiary(
  beneficiary: Omit<RakbankBeneficiary, 'beneficiaryId'>
): Promise<{ success: boolean; beneficiaryId?: string; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'RAKBANK API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/beneficiaries`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(beneficiary),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, beneficiaryId: data.beneficiaryId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Transfer money (RAKMoneyTransfer)
 */
export async function transferMoney(
  transfer: RakbankTransferRequest
): Promise<{ success: boolean; response?: RakbankTransferResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'RAKBANK API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/transfers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(transfer),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
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
 * Process card payment
 */
export async function processCardPayment(
  payment: RakbankCardPaymentRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'RAKBANK API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/card-payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, transactionId: data.transactionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Request OTP
 */
export async function requestOTP(
  request: RakbankOTPRequest
): Promise<{ success: boolean; reference?: string; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'RAKBANK API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/otp/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, reference: data.reference };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(
  verify: RakbankOTPVerify
): Promise<{ success: boolean; valid?: boolean; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'RAKBANK API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/otp/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(verify),
    });

    if (!response.ok) {
      throw new Error(`RAKBANK API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, valid: data.valid };
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
export function getMockAccounts(): RakbankAccount[] {
  return [
    {
      accountId: 'ACC001',
      accountNumber: 'XXXX1234',
      accountType: 'Current',
      currency: 'AED',
      balance: 25000.00,
      availableBalance: 24500.00,
      status: 'Active',
    },
    {
      accountId: 'ACC002',
      accountNumber: 'XXXX5678',
      accountType: 'Savings',
      currency: 'AED',
      balance: 150000.00,
      availableBalance: 150000.00,
      status: 'Active',
    },
  ];
}

export function getMockTransactions(): RakbankTransaction[] {
  return [
    {
      transactionId: 'TXN001',
      accountId: 'ACC001',
      type: 'DEBIT',
      amount: 500.00,
      currency: 'AED',
      description: 'DEWA Bill Payment',
      date: new Date().toISOString(),
      reference: 'DEWA-REF-001',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN002',
      accountId: 'ACC001',
      type: 'CREDIT',
      amount: 15000.00,
      currency: 'AED',
      description: 'Salary Credit',
      date: new Date(Date.now() - 86400000).toISOString(),
      reference: 'SALARY-2026-02',
      status: 'COMPLETED',
    },
  ];
}

export type {
  RakbankAccount,
  RakbankTransaction,
  RakbankBeneficiary,
  RakbankTransferRequest,
  RakbankTransferResponse,
};
