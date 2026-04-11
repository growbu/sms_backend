import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys.service.js';
import { KeyRateLimiterService } from '../services/key-rate-limiter.service.js';
import type { ApiKeyDocument } from '../schemas/api-key.schema.js';
export interface ApiKeyRequestContext {
    apiKey: ApiKeyDocument;
    apiKeyUserId: string;
}
export declare class ApiKeyGuard implements CanActivate {
    private readonly apiKeysService;
    private readonly rateLimiter;
    private readonly reflector;
    constructor(apiKeysService: ApiKeysService, rateLimiter: KeyRateLimiterService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractKey;
}
