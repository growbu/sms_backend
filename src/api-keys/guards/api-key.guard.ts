import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiKeysService } from '../api-keys.service.js';
import { KeyRateLimiterService } from '../services/key-rate-limiter.service.js';
import { REQUIRED_SCOPES_KEY } from '../decorators/required-scopes.decorator.js';
import type { ApiKeyDocument } from '../schemas/api-key.schema.js';

/**
 * Exported interface for routes to access the validated API key context.
 * Attach to request as `req.apiKey` and `req.apiKeyUserId`.
 */
export interface ApiKeyRequestContext {
  apiKey: ApiKeyDocument;
  apiKeyUserId: string;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly rateLimiter: KeyRateLimiterService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawKey = this.extractKey(request);

    if (!rawKey) {
      throw new UnauthorizedException(
        'API key is required. Provide it via x-api-key header or Authorization: Bearer <key>',
      );
    }

    // 1. Validate key exists
    const apiKey = await this.apiKeysService.validateKey(rawKey);
    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // 2. Check if revoked
    if (apiKey.revokedAt) {
      throw new UnauthorizedException('This API key has been revoked');
    }

    // 3. Check if active
    if (!apiKey.isActive) {
      throw new UnauthorizedException('This API key is inactive');
    }

    // 4. Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      throw new UnauthorizedException('This API key has expired');
    }

    // 5. Check scopes
    const requiredScopes = this.reflector.get<string[] | undefined>(
      REQUIRED_SCOPES_KEY,
      context.getHandler(),
    );

    if (requiredScopes && requiredScopes.length > 0) {
      const keyScopes = new Set(apiKey.scopes);
      const missingScopes = requiredScopes.filter((s) => !keyScopes.has(s));

      if (missingScopes.length > 0) {
        throw new ForbiddenException(
          `API key is missing required scope(s): ${missingScopes.join(', ')}`,
        );
      }
    }

    // 6. Check rate limit
    const keyId = (apiKey._id as { toString(): string }).toString();

    if (apiKey.rateLimitPerMinute) {
      const allowed = this.rateLimiter.check(keyId, apiKey.rateLimitPerMinute);
      if (!allowed) {
        const remaining = this.rateLimiter.remaining(
          keyId,
          apiKey.rateLimitPerMinute,
        );
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-RateLimit-Limit', apiKey.rateLimitPerMinute);
        response.setHeader('X-RateLimit-Remaining', remaining);

        throw new ForbiddenException(
          `Rate limit exceeded. Limit: ${apiKey.rateLimitPerMinute} requests/minute`,
        );
      }
    }

    // 7. Record usage (fire-and-forget to not block the response)
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.ip ??
      null;

    void this.apiKeysService.recordUsage(keyId, clientIp);

    // 8. Attach context to request
    const reqWithContext = request as Request & ApiKeyRequestContext;
    reqWithContext.apiKey = apiKey;
    reqWithContext.apiKeyUserId = apiKey.userId.toString();

    return true;
  }

  /**
   * Extract API key from:
   *  1. `x-api-key` header (preferred)
   *  2. `Authorization: Bearer <key>` header (if key starts with `smsgw_`)
   */
  private extractKey(request: Request): string | null {
    // Check x-api-key header first
    const xApiKey = request.headers['x-api-key'];
    if (typeof xApiKey === 'string' && xApiKey.length > 0) {
      return xApiKey;
    }

    // Fallback to Authorization: Bearer
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Only treat as API key if it matches our prefix
      if (token.startsWith('smsgw_')) {
        return token;
      }
    }

    return null;
  }
}
