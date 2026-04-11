"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const api_key_schema_js_1 = require("./schemas/api-key.schema.js");
let ApiKeysService = class ApiKeysService {
    apiKeyModel;
    constructor(apiKeyModel) {
        this.apiKeyModel = apiKeyModel;
    }
    async createApiKey(userId, dto) {
        const rawKey = this.generateRawKey();
        const prefix = this.extractPrefix(rawKey);
        const keyHash = this.hashKey(rawKey);
        const apiKey = await this.apiKeyModel.create({
            userId: new mongoose_2.Types.ObjectId(userId),
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
    async listApiKeys(userId) {
        return this.apiKeyModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }
    async getApiKey(userId, keyId) {
        return this.findKeyAndVerifyOwnership(userId, keyId);
    }
    async revokeApiKey(userId, keyId) {
        const apiKey = await this.findKeyAndVerifyOwnership(userId, keyId);
        if (apiKey.revokedAt) {
            throw new common_1.ConflictException('This API key is already revoked');
        }
        apiKey.isActive = false;
        apiKey.revokedAt = new Date();
        return apiKey.save();
    }
    async rotateApiKey(userId, keyId) {
        const apiKey = await this.findKeyAndVerifyOwnership(userId, keyId);
        if (apiKey.revokedAt) {
            throw new common_1.ConflictException('Cannot rotate a revoked key. Create a new one instead.');
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
    async deleteApiKey(userId, keyId) {
        const apiKey = await this.findKeyAndVerifyOwnership(userId, keyId);
        await apiKey.deleteOne();
    }
    async validateKey(rawKey) {
        const keyHash = this.hashKey(rawKey);
        const apiKey = await this.apiKeyModel
            .findOne({ keyHash })
            .exec();
        if (!apiKey) {
            return null;
        }
        return apiKey;
    }
    async recordUsage(keyId, ip) {
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
    serializeApiKey(apiKey) {
        const doc = apiKey.toObject();
        return {
            id: apiKey._id.toString(),
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
    serializeWithRawKey(apiKey, rawKey) {
        return {
            ...this.serializeApiKey(apiKey),
            key: rawKey,
        };
    }
    generateRawKey() {
        const random = (0, crypto_1.randomBytes)(32).toString('hex');
        const prefix = (0, crypto_1.randomBytes)(4).toString('hex');
        return `smsgw_${prefix}_${random}`;
    }
    extractPrefix(rawKey) {
        const parts = rawKey.split('_');
        return `${parts[0]}_${parts[1]}`;
    }
    hashKey(rawKey) {
        return (0, crypto_1.createHash)('sha256').update(rawKey).digest('hex');
    }
    async findKeyAndVerifyOwnership(userId, keyId) {
        if (!mongoose_2.Types.ObjectId.isValid(keyId)) {
            throw new common_1.NotFoundException('API key not found');
        }
        const apiKey = await this.apiKeyModel.findById(keyId).exec();
        if (!apiKey) {
            throw new common_1.NotFoundException('API key not found');
        }
        if (apiKey.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to access this API key');
        }
        return apiKey;
    }
};
exports.ApiKeysService = ApiKeysService;
exports.ApiKeysService = ApiKeysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(api_key_schema_js_1.ApiKey.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ApiKeysService);
//# sourceMappingURL=api-keys.service.js.map