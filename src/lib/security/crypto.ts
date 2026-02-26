// MAESTRO - Cryptographic Security
// PCI DSS Requirement 3, ISO 27001 A.10
// AES-256-GCM Encryption for data at rest

// ===========================
// CONFIGURATION
// ===========================

const CRYPTO_CONFIG = {
  // AES-256-GCM for symmetric encryption
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12, // 96 bits for GCM
  tagLength: 128, // 128 bits authentication tag
  
  // Key derivation
  kdfIterations: 100000,
  kdfHash: 'SHA-256',
  
  // Field encryption markers
  encryptedPrefix: 'enc:',
  maskedPrefix: 'msk:'
};

// ===========================
// KEY MANAGEMENT
// ===========================

// In production, these keys should be stored in AWS KMS, HashiCorp Vault, or similar
// This is a simplified implementation for demonstration

let cachedEncryptionKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }
  
  // Get key from environment (should be a base64-encoded 32-byte key)
  const keyString = process.env.ENCRYPTION_KEY || 'default-dev-key-do-not-use-in-production-32b';
  
  // Derive a proper key using PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const salt = encoder.encode('maestro-encryption-salt-v1');
  
  cachedEncryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: CRYPTO_CONFIG.kdfIterations,
      hash: CRYPTO_CONFIG.kdfHash
    },
    keyMaterial,
    {
      name: CRYPTO_CONFIG.algorithm,
      length: CRYPTO_CONFIG.keyLength
    },
    false,
    ['encrypt', 'decrypt']
  );
  
  return cachedEncryptionKey;
}

// ===========================
// ENCRYPTION FUNCTIONS
// ===========================

export async function encryptField(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;
  
  // Check if already encrypted
  if (plaintext.startsWith(CRYPTO_CONFIG.encryptedPrefix)) {
    return plaintext;
  }
  
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.ivLength));
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.algorithm,
        iv,
        tagLength: CRYPTO_CONFIG.tagLength
      },
      key,
      data
    );
    
    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Base64 encode
    const base64 = btoa(String.fromCharCode(...combined));
    
    return `${CRYPTO_CONFIG.encryptedPrefix}${base64}`;
  } catch (error) {
    console.error('[CRYPTO] Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

export async function decryptField(ciphertext: string): Promise<string> {
  if (!ciphertext) return ciphertext;
  
  // Check if encrypted
  if (!ciphertext.startsWith(CRYPTO_CONFIG.encryptedPrefix)) {
    return ciphertext;
  }
  
  try {
    const key = await getEncryptionKey();
    
    // Remove prefix and decode
    const base64 = ciphertext.slice(CRYPTO_CONFIG.encryptedPrefix.length);
    const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, CRYPTO_CONFIG.ivLength);
    const encrypted = combined.slice(CRYPTO_CONFIG.ivLength);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: CRYPTO_CONFIG.algorithm,
        iv,
        tagLength: CRYPTO_CONFIG.tagLength
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[CRYPTO] Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

// ===========================
// HASHING FUNCTIONS
// ===========================

export async function hashField(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value + (process.env.NEXTAUTH_SECRET || ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashFieldWithSalt(value: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const useSalt = salt || crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(value + useSalt + (process.env.NEXTAUTH_SECRET || ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, salt: useSalt };
}

// ===========================
// DATA MASKING
// ===========================

export function maskEmiratesId(emiratesId: string): string {
  if (!emiratesId || emiratesId.length < 10) return emiratesId;
  // Show only last 4 characters
  return emiratesId.slice(0, -4).replace(/\d/g, '*') + emiratesId.slice(-4);
}

export function maskMobileNumber(mobile: string): string {
  if (!mobile || mobile.length < 8) return mobile;
  // Show country code and last 4 digits
  const parts = mobile.split(' ');
  if (parts.length > 1) {
    return parts[0] + ' ***' + parts[1].slice(-4);
  }
  return mobile.slice(0, 4) + '***' + mobile.slice(-4);
}

export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 8) return cardNumber;
  // Show first 4 and last 4 digits
  return cardNumber.slice(0, 4) + ' **** **** ' + cardNumber.slice(-4);
}

export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 8) return accountNumber;
  return '****' + accountNumber.slice(-4);
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const maskedLocal = local.charAt(0) + '***' + (local.length > 1 ? local.charAt(local.length - 1) : '');
  return `${maskedLocal}@${domain}`;
}

// ===========================
// SECURE TOKEN GENERATION
// ===========================

export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateNumericCode(length: number = 6): string {
  const max = Math.pow(10, length) - 1;
  const min = Math.pow(10, length - 1);
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export function generateReferenceNumber(prefix: string = 'REF'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateSecureToken(4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ===========================
// SIGNING AND VERIFICATION
// ===========================

export async function signData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.NEXTAUTH_SECRET || 'default-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    encoder.encode(data)
  );
  
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifySignature(data: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(process.env.NEXTAUTH_SECRET || 'default-secret'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = Uint8Array.from(
      signature.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    
    return await crypto.subtle.verify(
      'HMAC',
      keyMaterial,
      signatureBuffer,
      encoder.encode(data)
    );
  } catch {
    return false;
  }
}

// ===========================
// SECURE COMPARISON
// ===========================

export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// ===========================
// PCI DSS COMPLIANCE HELPERS
// ===========================

export function isCardData(value: string): boolean {
  // Check for potential card numbers (13-19 digits)
  const cleaned = value.replace(/[\s-]/g, '');
  return /^\d{13,19}$/.test(cleaned);
}

export function isSensitiveData(value: string): boolean {
  // Check for various sensitive data patterns
  const patterns = [
    /^\d{13,16}$/, // Card numbers
    /^\d{3,4}$/, // CVV
    /^\d{2}\/\d{2,4}$/, // Expiry dates
    /^[A-Z]{2}\d{6}$/, // Passport numbers
    /^\d{3}-\d{4}-\d{4}-\d{1}$/, // Emirates ID
  ];
  
  const cleaned = value.replace(/[\s-]/g, '');
  return patterns.some(p => p.test(cleaned));
}

export function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password', 'passwordHash', 'token', 'secret', 'apiKey',
    'cardNumber', 'cvv', 'expiry', 'pin', 'emiratesId',
    'mobile', 'email', 'accountNumber'
  ];
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(f => lowerKey.includes(f));
    
    if (isSensitive && typeof value === 'string') {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// ===========================
// EXPORTS
// ===========================

export { CRYPTO_CONFIG };
