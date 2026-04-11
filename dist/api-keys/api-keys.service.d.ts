import { Model } from 'mongoose';
import { ApiKeyDocument } from './schemas/api-key.schema.js';
import { CreateApiKeyDto } from './dto/index.js';
export declare class ApiKeysService {
    private readonly apiKeyModel;
    constructor(apiKeyModel: Model<ApiKeyDocument>);
    createApiKey(userId: string, dto: CreateApiKeyDto): Promise<{
        apiKey: ApiKeyDocument;
        rawKey: string;
    }>;
    listApiKeys(userId: string): Promise<ApiKeyDocument[]>;
    getApiKey(userId: string, keyId: string): Promise<ApiKeyDocument>;
    revokeApiKey(userId: string, keyId: string): Promise<ApiKeyDocument>;
    rotateApiKey(userId: string, keyId: string): Promise<{
        apiKey: ApiKeyDocument;
        rawKey: string;
    }>;
    deleteApiKey(userId: string, keyId: string): Promise<void>;
    validateKey(rawKey: string): Promise<ApiKeyDocument | null>;
    recordUsage(keyId: string, ip: string | null): Promise<void>;
    serializeApiKey(apiKey: ApiKeyDocument): {
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
    serializeWithRawKey(apiKey: ApiKeyDocument, rawKey: string): {
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
    private generateRawKey;
    private extractPrefix;
    private hashKey;
    private findKeyAndVerifyOwnership;
}
