import crypto from 'crypto';

export class TokenManager {
  constructor() {
    // Use a fixed key for simplicity, but in production this should be from env
    // or generated and stored securely
    this.algorithm = 'aes-256-cbc';
    this.key = this.getOrCreateKey();
  }

  getOrCreateKey() {
    // In production, this should come from a secure location
    // For now, we'll use a deterministic key based on machine info
    const baseString = 'aloha-framework-tokens-2024';
    return crypto.createHash('sha256').update(baseString).digest();
  }

  encrypt(text) {
    if (!text) return null;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(text) {
    if (!text) return null;
    
    try {
      const parts = text.split(':');
      if (parts.length !== 2) return null;
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt token:', error.message);
      return null;
    }
  }
}