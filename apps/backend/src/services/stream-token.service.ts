import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { env } from '../config/env';

interface StreamToken {
  trackId: string;
  userId?: string;
  expires: number;
  nonce: string;
}

const TOKEN_EXPIRY_SECONDS = 300; // 5 minutes

class StreamTokenService {
  private get streamSecret(): string {
    // Derive a separate secret for stream tokens from JWT_SECRET
    return createHmac('sha256', env.JWT_SECRET)
      .update('stream-token-v1')
      .digest('hex');
  }

  generateStreamToken(trackId: string, userId?: string): string {
    const payload: StreamToken = {
      trackId,
      userId,
      expires: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
      nonce: randomBytes(8).toString('hex'),
    };

    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(data);

    return `${data}.${signature}`;
  }

  verifyStreamToken(token: string): StreamToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;

      const [data, signature] = parts;
      if (!data || !signature) return null;

      // Verify signature using timing-safe comparison
      const expectedSignature = this.sign(data);
      if (!this.safeCompare(signature, expectedSignature)) {
        return null;
      }

      // Decode payload
      const payload = JSON.parse(
        Buffer.from(data, 'base64url').toString('utf8')
      ) as StreamToken;

      // Check expiration
      if (payload.expires < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private sign(data: string): string {
    return createHmac('sha256', this.streamSecret)
      .update(data)
      .digest('base64url');
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

export const streamTokenService = new StreamTokenService();
