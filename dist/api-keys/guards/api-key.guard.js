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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const api_keys_service_js_1 = require("../api-keys.service.js");
const key_rate_limiter_service_js_1 = require("../services/key-rate-limiter.service.js");
const required_scopes_decorator_js_1 = require("../decorators/required-scopes.decorator.js");
let ApiKeyGuard = class ApiKeyGuard {
    apiKeysService;
    rateLimiter;
    reflector;
    constructor(apiKeysService, rateLimiter, reflector) {
        this.apiKeysService = apiKeysService;
        this.rateLimiter = rateLimiter;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const rawKey = this.extractKey(request);
        if (!rawKey) {
            throw new common_1.UnauthorizedException('API key is required. Provide it via x-api-key header or Authorization: Bearer <key>');
        }
        const apiKey = await this.apiKeysService.validateKey(rawKey);
        if (!apiKey) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        if (apiKey.revokedAt) {
            throw new common_1.UnauthorizedException('This API key has been revoked');
        }
        if (!apiKey.isActive) {
            throw new common_1.UnauthorizedException('This API key is inactive');
        }
        if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
            throw new common_1.UnauthorizedException('This API key has expired');
        }
        const requiredScopes = this.reflector.get(required_scopes_decorator_js_1.REQUIRED_SCOPES_KEY, context.getHandler());
        if (requiredScopes && requiredScopes.length > 0) {
            const keyScopes = new Set(apiKey.scopes);
            const missingScopes = requiredScopes.filter((s) => !keyScopes.has(s));
            if (missingScopes.length > 0) {
                throw new common_1.ForbiddenException(`API key is missing required scope(s): ${missingScopes.join(', ')}`);
            }
        }
        const keyId = apiKey._id.toString();
        if (apiKey.rateLimitPerMinute) {
            const allowed = this.rateLimiter.check(keyId, apiKey.rateLimitPerMinute);
            if (!allowed) {
                const remaining = this.rateLimiter.remaining(keyId, apiKey.rateLimitPerMinute);
                const response = context.switchToHttp().getResponse();
                response.setHeader('X-RateLimit-Limit', apiKey.rateLimitPerMinute);
                response.setHeader('X-RateLimit-Remaining', remaining);
                throw new common_1.ForbiddenException(`Rate limit exceeded. Limit: ${apiKey.rateLimitPerMinute} requests/minute`);
            }
        }
        const clientIp = request.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
            request.ip ??
            null;
        void this.apiKeysService.recordUsage(keyId, clientIp);
        const reqWithContext = request;
        reqWithContext.apiKey = apiKey;
        reqWithContext.apiKeyUserId = apiKey.userId.toString();
        return true;
    }
    extractKey(request) {
        const xApiKey = request.headers['x-api-key'];
        if (typeof xApiKey === 'string' && xApiKey.length > 0) {
            return xApiKey;
        }
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            if (token.startsWith('smsgw_')) {
                return token;
            }
        }
        return null;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_keys_service_js_1.ApiKeysService,
        key_rate_limiter_service_js_1.KeyRateLimiterService,
        core_1.Reflector])
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map