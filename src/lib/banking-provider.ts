/**
 * Unified Banking Provider Service
 * 
 * Aggregates banking services from multiple UAE banks:
 * - RAKBANK
 * - Mashreq Bank
 * - Wio Bank
 * - Emirates NBD
 * 
 * This provides a single interface for:
 * - Account management
 * - Balance inquiries
 * - Transaction history
 * - Payments and transfers
 * - Beneficiary management
 */

import * as rakbank from './rakbank';
import * as mashreq from './mashreq';
import * as wio from './wio';
import * as emiratesNbd from './emirates-nbd';

// Types
export type BankProvider = 'rakbank' | 'mashreq' | 'wio' | 'emirates_nbd';

export interface UnifiedAccount {
  id: string;
  provider: BankProvider;
  accountNumber: string;
  iban?: string;
  accountType: string;
  currency: string;
  balance: number;
  availableBalance: number;
  status: string;
  lastSync?: Date;
}

export interface UnifiedTransaction {
  id: string;
  provider: BankProvider;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  category?: string;
  date: string;
  reference: string;
  status: string;
}

export interface UnifiedBeneficiary {
  id: string;
  provider: BankProvider;
  name: string;
  bankName?: string;
  accountNumber: string;
  iban?: string;
  country?: string;
  currency: string;
  isVerified?: boolean;
}

export interface TransferRequest {
  provider: BankProvider;
  fromAccountId: string;
  toBeneficiaryId: string;
  amount: number;
  currency: string;
  purpose: string;
  reference: string;
}

export interface TransferResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  reference?: string;
  error?: string;
}

export interface ProviderStatus {
  name: BankProvider;
  displayName: string;
  configured: boolean;
  environment: 'sandbox' | 'production';
  features: string[];
  lastChecked: Date;
}

/**
 * Get status of all banking providers
 */
export function getProvidersStatus(): ProviderStatus[] {
  return [
    {
      name: 'rakbank',
      displayName: 'RAKBANK',
      configured: rakbank.isConfigured(),
      environment: rakbank.getConfigStatus().environment,
      features: ['accounts', 'transfers', 'beneficiaries', 'card-payments', 'otp'],
      lastChecked: new Date(),
    },
    {
      name: 'mashreq',
      displayName: 'Mashreq Bank',
      configured: mashreq.isConfigured(),
      environment: mashreq.getConfigStatus().environment,
      features: ['accounts', 'payments', 'aani-instant', 'cards', 'transactions'],
      lastChecked: new Date(),
    },
    {
      name: 'wio',
      displayName: 'Wio Bank',
      configured: wio.isConfigured(),
      environment: wio.getConfigStatus().environment,
      features: ['accounts', 'transfers', 'payment-links', 'cards', 'invoices'],
      lastChecked: new Date(),
    },
    {
      name: 'emirates_nbd',
      displayName: 'Emirates NBD',
      configured: emiratesNbd.isConfigured(),
      environment: emiratesNbd.getConfigStatus().environment,
      features: ['accounts', 'payments', 'aani-instant', 'cards', 'transactions', 'direct-debit'],
      lastChecked: new Date(),
    },
  ];
}

/**
 * Get all accounts from all connected banks
 */
export async function getAllAccounts(): Promise<{
  accounts: UnifiedAccount[];
  errors: Array<{ provider: BankProvider; error: string }>;
}> {
  const accounts: UnifiedAccount[] = [];
  const errors: Array<{ provider: BankProvider; error: string }> = [];

  // Fetch from RAKBANK
  if (rakbank.isConfigured()) {
    const result = await rakbank.getAccounts();
    if (result.success && result.accounts) {
      accounts.push(...result.accounts.map(acc => ({
        id: acc.accountId,
        provider: 'rakbank' as BankProvider,
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        currency: acc.currency,
        balance: acc.balance,
        availableBalance: acc.availableBalance,
        status: acc.status,
        lastSync: new Date(),
      })));
    } else if (result.error) {
      errors.push({ provider: 'rakbank', error: result.error });
    }
  } else {
    // Use mock data for demo
    const mockAccounts = rakbank.getMockAccounts();
    accounts.push(...mockAccounts.map(acc => ({
      id: acc.accountId,
      provider: 'rakbank' as BankProvider,
      accountNumber: acc.accountNumber,
      accountType: acc.accountType,
      currency: acc.currency,
      balance: acc.balance,
      availableBalance: acc.availableBalance,
      status: acc.status,
      lastSync: new Date(),
    })));
  }

  // Fetch from Mashreq
  if (mashreq.isConfigured()) {
    const result = await mashreq.getAccounts();
    if (result.success && result.accounts) {
      accounts.push(...result.accounts.map(acc => ({
        id: acc.id,
        provider: 'mashreq' as BankProvider,
        accountNumber: acc.accountNumber,
        iban: acc.iban,
        accountType: acc.accountType,
        currency: acc.currency,
        balance: acc.balance,
        availableBalance: acc.availableBalance,
        status: acc.status,
        lastSync: new Date(),
      })));
    } else if (result.error) {
      errors.push({ provider: 'mashreq', error: result.error });
    }
  } else {
    // Use mock data for demo
    const mockAccounts = mashreq.getMockAccounts();
    accounts.push(...mockAccounts.map(acc => ({
      id: acc.id,
      provider: 'mashreq' as BankProvider,
      accountNumber: acc.accountNumber,
      iban: acc.iban,
      accountType: acc.accountType,
      currency: acc.currency,
      balance: acc.balance,
      availableBalance: acc.availableBalance,
      status: acc.status,
      lastSync: new Date(),
    })));
  }

  // Fetch from Wio
  if (wio.isConfigured()) {
    const result = await wio.getAccounts();
    if (result.success && result.accounts) {
      accounts.push(...result.accounts.map(acc => ({
        id: acc.id,
        provider: 'wio' as BankProvider,
        accountNumber: acc.accountNumber,
        iban: acc.iban,
        accountType: acc.accountType,
        currency: acc.currency,
        balance: acc.balance,
        availableBalance: acc.availableBalance,
        status: acc.status,
        lastSync: new Date(),
      })));
    } else if (result.error) {
      errors.push({ provider: 'wio', error: result.error });
    }
  } else {
    // Use mock data for demo
    const mockAccounts = wio.getMockAccounts();
    accounts.push(...mockAccounts.map(acc => ({
      id: acc.id,
      provider: 'wio' as BankProvider,
      accountNumber: acc.accountNumber,
      iban: acc.iban,
      accountType: acc.accountType,
      currency: acc.currency,
      balance: acc.balance,
      availableBalance: acc.availableBalance,
      status: acc.status,
      lastSync: new Date(),
    })));
  }

  // Fetch from Emirates NBD
  if (emiratesNbd.isConfigured()) {
    const result = await emiratesNbd.getAccounts();
    if (result.success && result.accounts) {
      accounts.push(...result.accounts.map(acc => ({
        id: acc.id,
        provider: 'emirates_nbd' as BankProvider,
        accountNumber: acc.accountNumber,
        iban: acc.iban,
        accountType: acc.accountType,
        currency: acc.currency,
        balance: acc.balance,
        availableBalance: acc.availableBalance,
        status: acc.status,
        lastSync: new Date(),
      })));
    } else if (result.error) {
      errors.push({ provider: 'emirates_nbd', error: result.error });
    }
  } else {
    // Use mock data for demo
    const mockAccounts = emiratesNbd.getMockAccounts();
    accounts.push(...mockAccounts.map(acc => ({
      id: acc.id,
      provider: 'emirates_nbd' as BankProvider,
      accountNumber: acc.accountNumber,
      iban: acc.iban,
      accountType: acc.accountType,
      currency: acc.currency,
      balance: acc.balance,
      availableBalance: acc.availableBalance,
      status: acc.status,
      lastSync: new Date(),
    })));
  }

  return { accounts, errors };
}

/**
 * Get total balance across all accounts
 */
export async function getTotalBalance(): Promise<{
  total: number;
  byCurrency: Record<string, number>;
  byProvider: Record<BankProvider, number>;
}> {
  const { accounts } = await getAllAccounts();
  
  const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const byCurrency: Record<string, number> = {};
  const byProvider: Record<BankProvider, number> = { 
    rakbank: 0, 
    mashreq: 0, 
    wio: 0,
    emirates_nbd: 0,
  };

  for (const acc of accounts) {
    byCurrency[acc.currency] = (byCurrency[acc.currency] || 0) + acc.balance;
    byProvider[acc.provider] += acc.balance;
  }

  return { total, byCurrency, byProvider };
}

/**
 * Get recent transactions from all accounts
 */
export async function getRecentTransactions(limit = 20): Promise<{
  transactions: UnifiedTransaction[];
  errors: Array<{ provider: BankProvider; error: string }>;
}> {
  const transactions: UnifiedTransaction[] = [];
  const errors: Array<{ provider: BankProvider; error: string }> = [];

  // Get mock transactions for demo
  const rakbankTxns = rakbank.getMockTransactions();
  transactions.push(...rakbankTxns.map(txn => ({
    id: txn.transactionId,
    provider: 'rakbank' as BankProvider,
    accountId: txn.accountId,
    type: txn.type as 'CREDIT' | 'DEBIT',
    amount: txn.amount,
    currency: txn.currency,
    description: txn.description,
    date: txn.date,
    reference: txn.reference,
    status: txn.status,
  })));

  const mashreqTxns = mashreq.getMockTransactions();
  transactions.push(...mashreqTxns.map(txn => ({
    id: txn.id,
    provider: 'mashreq' as BankProvider,
    accountId: txn.accountId,
    type: txn.type as 'CREDIT' | 'DEBIT',
    amount: txn.amount,
    currency: txn.currency,
    description: txn.description,
    merchantName: txn.merchantName,
    category: txn.category,
    date: txn.bookingDate,
    reference: txn.reference,
    status: txn.status,
  })));

  const wioTxns = wio.getMockTransactions();
  transactions.push(...wioTxns.map(txn => ({
    id: txn.id,
    provider: 'wio' as BankProvider,
    accountId: txn.accountId,
    type: txn.type as 'CREDIT' | 'DEBIT',
    amount: txn.amount,
    currency: txn.currency,
    description: txn.description,
    merchantName: txn.merchantName,
    category: txn.merchantCategory,
    date: txn.bookingDate,
    reference: txn.reference,
    status: txn.status,
  })));

  const emiratesNbdTxns = emiratesNbd.getMockTransactions();
  transactions.push(...emiratesNbdTxns.map(txn => ({
    id: txn.id,
    provider: 'emirates_nbd' as BankProvider,
    accountId: txn.accountId,
    type: txn.type,
    amount: txn.amount,
    currency: txn.currency,
    description: txn.description,
    merchantName: txn.merchantName,
    category: txn.category,
    date: txn.bookingDate,
    reference: txn.reference,
    status: txn.status,
  })));

  // Sort by date (most recent first)
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { transactions: transactions.slice(0, limit), errors };
}

/**
 * Make transfer using specified provider
 */
export async function makeTransfer(request: TransferRequest): Promise<TransferResponse> {
  switch (request.provider) {
    case 'rakbank':
      const rakbankResult = await rakbank.transferMoney({
        fromAccountId: request.fromAccountId,
        beneficiaryId: request.toBeneficiaryId,
        amount: request.amount,
        currency: request.currency,
        reference: request.reference,
        purpose: request.purpose,
      });
      if (rakbankResult.success && rakbankResult.response) {
        return {
          success: true,
          transactionId: rakbankResult.response.transactionId,
          status: rakbankResult.response.status,
          reference: rakbankResult.response.reference,
        };
      }
      return { success: false, error: rakbankResult.error };

    case 'mashreq':
      const mashreqResult = await mashreq.makePayment({
        fromAccount: request.fromAccountId,
        toAccount: request.toBeneficiaryId,
        amount: request.amount,
        currency: request.currency,
        purpose: request.purpose,
        reference: request.reference,
        paymentType: 'INSTANT',
      });
      if (mashreqResult.success && mashreqResult.response) {
        return {
          success: true,
          transactionId: mashreqResult.response.paymentId,
          status: mashreqResult.response.status,
          reference: mashreqResult.response.reference,
        };
      }
      return { success: false, error: mashreqResult.error };

    case 'wio':
      const wioResult = await wio.makeTransfer({
        fromAccountId: request.fromAccountId,
        toBeneficiaryId: request.toBeneficiaryId,
        amount: request.amount,
        currency: request.currency,
        purpose: request.purpose,
        reference: request.reference,
      });
      if (wioResult.success && wioResult.response) {
        return {
          success: true,
          transactionId: wioResult.response.transferId,
          status: wioResult.response.status,
          reference: wioResult.response.reference,
        };
      }
      return { success: false, error: wioResult.error };

    case 'emirates_nbd':
      const enbdResult = await emiratesNbd.makePayment({
        fromAccountId: request.fromAccountId,
        beneficiaryId: request.toBeneficiaryId,
        amount: request.amount,
        currency: request.currency,
        purpose: request.purpose,
        reference: request.reference,
        paymentType: 'INSTANT',
      });
      if (enbdResult.success && enbdResult.response) {
        return {
          success: true,
          transactionId: enbdResult.response.paymentId,
          status: enbdResult.response.status,
          reference: enbdResult.response.reference,
        };
      }
      return { success: false, error: enbdResult.error };

    default:
      return { success: false, error: 'Unknown provider' };
  }
}

/**
 * Get all beneficiaries from all providers
 */
export async function getAllBeneficiaries(): Promise<{
  beneficiaries: UnifiedBeneficiary[];
  errors: Array<{ provider: BankProvider; error: string }>;
}> {
  const beneficiaries: UnifiedBeneficiary[] = [];
  const errors: Array<{ provider: BankProvider; error: string }> = [];

  // RAKBANK
  if (rakbank.isConfigured()) {
    const result = await rakbank.getBeneficiaries();
    if (result.success && result.beneficiaries) {
      beneficiaries.push(...result.beneficiaries.map(b => ({
        id: b.beneficiaryId,
        provider: 'rakbank' as BankProvider,
        name: b.name,
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        iban: b.iban,
        country: b.country,
        currency: b.currency,
      })));
    } else if (result.error) {
      errors.push({ provider: 'rakbank', error: result.error });
    }
  }

  // Wio
  if (wio.isConfigured()) {
    const result = await wio.getBeneficiaries();
    if (result.success && result.beneficiaries) {
      beneficiaries.push(...result.beneficiaries.map(b => ({
        id: b.id,
        provider: 'wio' as BankProvider,
        name: b.name,
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        iban: b.iban,
        country: b.country,
        currency: b.currency,
        isVerified: b.isVerified,
      })));
    } else if (result.error) {
      errors.push({ provider: 'wio', error: result.error });
    }
  }

  // Emirates NBD
  if (emiratesNbd.isConfigured()) {
    const result = await emiratesNbd.getBeneficiaries();
    if (result.success && result.beneficiaries) {
      beneficiaries.push(...result.beneficiaries.map(b => ({
        id: b.id,
        provider: 'emirates_nbd' as BankProvider,
        name: b.name,
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        iban: b.iban,
        country: b.country,
        currency: b.currency,
        isVerified: b.isVerified,
      })));
    } else if (result.error) {
      errors.push({ provider: 'emirates_nbd', error: result.error });
    }
  }

  return { beneficiaries, errors };
}

/**
 * Find best route for payment (lowest fees, fastest)
 */
export async function findBestPaymentRoute(
  amount: number,
  currency: string = 'AED'
): Promise<{
  recommendedProvider: BankProvider;
  reason: string;
  alternatives: Array<{ provider: BankProvider; estimatedTime: string; fees: number }>;
}> {
  // Simple routing logic - can be enhanced with real fee comparison
  const providers = getProvidersStatus();
  const configured = providers.filter(p => p.configured);

  if (configured.length === 0) {
    // Use mock recommendation
    return {
      recommendedProvider: 'emirates_nbd',
      reason: 'Emirates NBD offers instant payments via AANI with competitive fees',
      alternatives: [
        { provider: 'mashreq', estimatedTime: 'Instant', fees: 0 },
        { provider: 'wio', estimatedTime: 'Instant', fees: 0 },
        { provider: 'rakbank', estimatedTime: 'Same day', fees: 5 },
      ],
    };
  }

  // Prefer Emirates NBD or Mashreq for instant payments (AANI)
  if (configured.some(p => p.name === 'emirates_nbd')) {
    return {
      recommendedProvider: 'emirates_nbd',
      reason: 'Instant payment via AANI available',
      alternatives: configured
        .filter(p => p.name !== 'emirates_nbd')
        .map(p => ({ provider: p.name, estimatedTime: 'Same day', fees: 0 })),
    };
  }

  if (configured.some(p => p.name === 'mashreq')) {
    return {
      recommendedProvider: 'mashreq',
      reason: 'Instant payment via AANI available',
      alternatives: configured
        .filter(p => p.name !== 'mashreq')
        .map(p => ({ provider: p.name, estimatedTime: 'Same day', fees: 0 })),
    };
  }

  // Default to first configured
  return {
    recommendedProvider: configured[0].name,
    reason: 'Primary connected bank',
    alternatives: configured.slice(1).map(p => ({ provider: p.name, estimatedTime: 'Same day', fees: 0 })),
  };
}

export type {
  UnifiedAccount,
  UnifiedTransaction,
  UnifiedBeneficiary,
  TransferRequest,
  TransferResponse,
  ProviderStatus,
};
