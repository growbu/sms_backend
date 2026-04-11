import { HttpStatus } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/index.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: UserDocument;
}
export declare class ApiKeysController {
    private readonly apiKeysService;
    constructor(apiKeysService: ApiKeysService);
    create(req: AuthenticatedRequest, dto: CreateApiKeyDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            key: string;
            id: string;
            name: unknown;
            prefix: unknown;
            scopes: unknown;
            isActive: unknown;
            lastUsedAt: unknown;
            requestCount: unknown;
            rateLimitPerMinute: unknown;
            expiresAt: unknown;
            revokedAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    list(req: AuthenticatedRequest): Promise<{
        statusCode: HttpStatus;
        data: {
            id: string;
            name: unknown;
            prefix: unknown;
            scopes: unknown;
            isActive: unknown;
            lastUsedAt: unknown;
            requestCount: unknown;
            rateLimitPerMinute: unknown;
            expiresAt: unknown;
            revokedAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        }[];
    }>;
    getOne(req: AuthenticatedRequest, keyId: string): Promise<{
        statusCode: HttpStatus;
        data: {
            id: string;
            name: unknown;
            prefix: unknown;
            scopes: unknown;
            isActive: unknown;
            lastUsedAt: unknown;
            requestCount: unknown;
            rateLimitPerMinute: unknown;
            expiresAt: unknown;
            revokedAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    revoke(req: AuthenticatedRequest, keyId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            name: unknown;
            prefix: unknown;
            scopes: unknown;
            isActive: unknown;
            lastUsedAt: unknown;
            requestCount: unknown;
            rateLimitPerMinute: unknown;
            expiresAt: unknown;
            revokedAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    rotate(req: AuthenticatedRequest, keyId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            key: string;
            id: string;
            name: unknown;
            prefix: unknown;
            scopes: unknown;
            isActive: unknown;
            lastUsedAt: unknown;
            requestCount: unknown;
            rateLimitPerMinute: unknown;
            expiresAt: unknown;
            revokedAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    delete(req: AuthenticatedRequest, keyId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
export {};
