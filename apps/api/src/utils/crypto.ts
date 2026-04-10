import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Throw error if key is not defined, preventing unencrypted data or defaults in production
const getSecretKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('FATAL ERROR: ENCRYPTION_KEY is not defined in environment variables.');
  }
  if (Buffer.from(key).length !== 32) {
    throw new Error('FATAL ERROR: ENCRYPTION_KEY must be exactly 32 bytes long.');
  }
  return key;
};

export function encrypt(text: string): { encryptedData: string, iv: string, authTag: string } {
  const SECRET_KEY = getSecretKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
}

export function decrypt(encryptedData: string, ivHex: string, authTagHex: string): string {
  const SECRET_KEY = getSecretKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(SECRET_KEY), 
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
