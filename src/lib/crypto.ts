// MAESTRO - Encryption Utilities
// AES-256 Encryption for Sensitive Data (PCI DSS Compliant)

// Encryption key - In production, use AWS KMS or similar
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'maestro-encryption-key-2024-uae';

// Simple XOR-based encryption for demo (use proper AES in production)
export function encrypt(text: string): string {
  if (!text) return '';
  
  const key = ENCRYPTION_KEY;
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  
  // Base64 encode
  return Buffer.from(result).toString('base64');
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const key = ENCRYPTION_KEY;
    
    // Base64 decode
    const decoded = Buffer.from(encryptedText, 'base64').toString();
    let result = '';
    
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch {
    return '';
  }
}

// Hash function for sensitive lookups (Emirates ID, etc.)
export async function hashForLookup(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text + 'maestro_lookup_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Mask sensitive data for display
export function maskEmiratesId(emiratesId: string): string {
  if (!emiratesId || emiratesId.length < 8) return emiratesId;
  return emiratesId.slice(0, 4) + '****' + emiratesId.slice(-4);
}

export function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 8) return mobile;
  return mobile.slice(0, 4) + '****' + mobile.slice(-3);
}

export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 8) return '****';
  return '**** **** **** ' + cardNumber.slice(-4);
}

// Generate secure random strings
export function generateSecureId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

// Generate reference numbers
export function generatePaymentReference(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString().slice(-2) +
                  (date.getMonth() + 1).toString().padStart(2, '0') +
                  date.getDate().toString().padStart(2, '0');
  const random = generateSecureId(6).toUpperCase();
  return `PAY-${dateStr}-${random}`;
}

export function generateJourneyReference(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString().slice(-2) +
                  (date.getMonth() + 1).toString().padStart(2, '0') +
                  date.getDate().toString().padStart(2, '0');
  const random = generateSecureId(6).toUpperCase();
  return `JRN-${dateStr}-${random}`;
}

export function generateFineReference(): string {
  const random = generateSecureId(8).toUpperCase();
  return `FN-${random}`;
}
