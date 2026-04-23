import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema.js';
import { CreateApiKeyDto } from './dto/index.js';

/**
 * Key format: smsgw_<prefix>_<random>
 * - Full key shown once at creation
 * - Only SHA-256 hash stored in DB
 * - `prefix` stored in plaintext for UI display (e.g., "smsgw_ab12")
 *
 * Lookup strategy: hash incoming key with SHA-256 → find by `keyHash` index → O(1)
 */
@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  // ─── Create API Key ─────────────────────────────────────────────────

  async createApiKey(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKeyDocument; rawKey: string }> {
    const rawKey = this.generateRawKey();
    const prefix = this.extractPrefix(rawKey);
    const keyHash = this.hashKey(rawKey);

    const apiKey = await this.apiKeyModel.create({
      userId: new Types.ObjectId(userId),
      name: dto.name.trim(),
      prefix,
      keyHash,
      scopes: dto.scopes ?? ['messages:send'],
      isActive: true,
      rateLimitPerMinute: dto.rateLimitPerMinute ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    return { apiKey, rawKey };
  }

  // ─── List User's API Keys ──────────────────────────────────────────

  async listApiKeys(userId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ─── Get Single API Key ────────────────────────────────────────────

  async getApiKey(
    userId: string,
    keyId: string,
  ): Promise<ApiKeyDocument> {
    return this.findKeyAndVerifyOwnership(userId, keyId);
  }

  // ─── Revoke ────────────────────────────────────────────────────────

  async revokeApiKey(
    userId: string,
    keyId: string,
  ): Promise<ApiKeyDocument> {
    const apiKey = await this.findKeyAndVerifyOwnership(userId, keyId);

    if (apiKey.revokedAt) {
      throw new ConflictException('This API key is already revoked');
    }

    apiKey.isActive = false;
    apiKey.revokedAt = new Date();
    return apiKey.save();
  }

  // ─── Rotate (Regenerate) ──────────────────────────────────────────

  async rotateApiKey(
    userId: string,
    keyId: string,
  ): Promise<{ apiKey: ApiKeyDocument; rawKey: string }> {
    const apiKey = await this.findKeyAndVerifyOwnership(userId, keyId);

    if (apiKey.revokedAt) {
      throw new ConflictException(
        'Cannot rotate a revoked key. Create a new one instead.',
      );
    }

    const rawKey = this.generateRawKey();
    const prefix = this.extractPrefix(rawKey);
    const keyHash = this.hashKey(rawKey);

    apiKey.prefix = prefix;
    apiKey.keyHash = keyHash;
    apiKey.isActive = true;
    apiKey.lastUsedAt = null;
    apiKey.lastUsedIp = null;
    apiKey.requestCount = 0;
    await apiKey.save();

    return { apiKey, rawKey };
  }

  // ─── Delete ───────────────────────────────────────────────────────

  async deleteApiKey(
    userId: string,
    keyId: string,
  ): Promise<void> {
    const apiKey = await this.findKeyAndVerifyOwnership(userId, keyId);
    await apiKey.deleteOne();
  }

  // ─── Validate Key (used by ApiKeyGuard) ───────────────────────────

  async validateKey(rawKey: string): Promise<ApiKeyDocument | null> {
    const keyHash = this.hashKey(rawKey);

    const apiKey = await this.apiKeyModel
      .findOne({ keyHash })
      .exec();

    if (!apiKey) {
      return null;
    }

    return apiKey;
  }

  // ─── Verify Key (public check — no auth required) ─────────────────

  async verifyKey(rawKey: string): Promise<{
    valid: boolean;
    reason: string | null;
    keyInfo: {
      name: string;
      prefix: string;
      scopes: string[];
      rateLimitPerMinute: number | null;
      expiresAt: Date | null;
    } | null;
  }> {
    const apiKey = await this.validateKey(rawKey);

    if (!apiKey) {
      return { valid: false, reason: 'API key not found', keyInfo: null };
    }

    if (apiKey.revokedAt) {
      return { valid: false, reason: 'API key has been revoked', keyInfo: null };
    }

    if (!apiKey.isActive) {
      return { valid: false, reason: 'API key is inactive', keyInfo: null };
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { valid: false, reason: 'API key has expired', keyInfo: null };
    }

    const canSendMessages = apiKey.scopes.includes('messages:send');
    if (!canSendMessages) {
      return {
        valid: false,
        reason: 'API key does not have the "messages:send" scope',
        keyInfo: null,
      };
    }

    return {
      valid: true,
      reason: null,
      keyInfo: {
        name: apiKey.name,
        prefix: apiKey.prefix,
        scopes: apiKey.scopes,
        rateLimitPerMinute: apiKey.rateLimitPerMinute,
        expiresAt: apiKey.expiresAt,
      },
    };
  }

  /**
   * Record that the key was used: update lastUsedAt, lastUsedIp,
   * and increment requestCount.
   */
  async recordUsage(
    keyId: string,
    ip: string | null,
  ): Promise<void> {
    await this.apiKeyModel
      .findByIdAndUpdate(keyId, {
        $set: {
          lastUsedAt: new Date(),
          lastUsedIp: ip,
        },
        $inc: { requestCount: 1 },
      })
      .exec();
  }

  // ─── Response Serializers ─────────────────────────────────────────

  serializeApiKey(apiKey: ApiKeyDocument) {
    const doc = apiKey.toObject() as unknown as Record<string, unknown>;
    return {
      id: (apiKey._id as { toString(): string }).toString(),
      name: doc.name,
      prefix: doc.prefix,
      scopes: doc.scopes,
      isActive: doc.isActive,
      lastUsedAt: doc.lastUsedAt,
      requestCount: doc.requestCount,
      rateLimitPerMinute: doc.rateLimitPerMinute,
      expiresAt: doc.expiresAt,
      revokedAt: doc.revokedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  serializeWithRawKey(apiKey: ApiKeyDocument, rawKey: string) {
    return {
      ...this.serializeApiKey(apiKey),
      key: rawKey,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private generateRawKey(): string {
    const random = randomBytes(32).toString('hex');
    // Format: smsgw_<8-char-prefix>_<64-char-hex>
    const prefix = randomBytes(4).toString('hex');
    return `smsgw_${prefix}_${random}`;
  }

  private extractPrefix(rawKey: string): string {
    // Returns "smsgw_<8chars>" for UI display
    const parts = rawKey.split('_');
    return `${parts[0]}_${parts[1]}`;
  }

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  private async findKeyAndVerifyOwnership(
    userId: string,
    keyId: string,
  ): Promise<ApiKeyDocument> {
    if (!Types.ObjectId.isValid(keyId)) {
      throw new NotFoundException('API key not found');
    }

    const apiKey = await this.apiKeyModel.findById(keyId).exec();

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this API key',
      );
    }

    return apiKey;
  }
}
