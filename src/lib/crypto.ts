// MAESTRO - Crypto Utilities
// Re-exports from security module for backwards compatibility
// PCI DSS Requirement 3, ISO 27001 A.10

// Import from new security module
export {
  encryptField,
  decryptField,
  hashField,
  hashFieldWithSalt,
  maskEmiratesId,
  maskMobileNumber,
  maskCardNumber,
  maskAccountNumber,
  maskEmail,
  generateSecureToken,
  generateNumericCode,
  generateReferenceNumber,
  signData,
  verifySignature,
  secureCompare,
  isCardData,
  isSensitiveData,
  sanitizeForLogging,
  CRYPTO_CONFIG
} from './security/crypto';

// Keep backwards-compatible function names
import { 
  encryptField, 
  decryptField, 
  hashField, 
  maskEmiratesId as maskEmiratesIdNew,
  maskMobileNumber,
  maskCardNumber as maskCardNumberNew,
  generateSecureToken
} from './security/crypto';

// Legacy exports for backwards compatibility
export const encrypt = encryptField;
export const decrypt = decryptField;
export const hashForLookup = hashField;
export const maskEmiratesId = maskEmiratesIdNew;
export const maskMobile = maskMobileNumber;
export const maskCardNumber = (cardNumber: string): string => {
  if (!cardNumber || cardNumber.length < 8) return '****';
  return '**** **** **** ' + cardNumber.slice(-4);
};
export const generateSecureId = generateSecureToken;

// Generate reference numbers
export function generatePaymentReference(): string {
  return generateReferenceNumber('PAY');
}

export function generateJourneyReference(): string {
  return generateReferenceNumber('JRN');
}

export function generateFineReference(): string {
  return generateReferenceNumber('FN');
}

import { generateReferenceNumber } from './security/crypto';
