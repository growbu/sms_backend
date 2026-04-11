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
exports.ApiKeysController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_js_1 = require("../auth/guards/jwt-auth.guard.js");
const api_keys_service_js_1 = require("./api-keys.service.js");
const index_js_1 = require("./dto/index.js");
let ApiKeysController = class ApiKeysController {
    apiKeysService;
    constructor(apiKeysService) {
        this.apiKeysService = apiKeysService;
    }
    async create(req, dto) {
        const userId = req.user._id.toString();
        const { apiKey, rawKey } = await this.apiKeysService.createApiKey(userId, dto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'API key created successfully. Store the key securely — it will not be shown again.',
            data: this.apiKeysService.serializeWithRawKey(apiKey, rawKey),
        };
    }
    async list(req) {
        const userId = req.user._id.toString();
        const keys = await this.apiKeysService.listApiKeys(userId);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: keys.map((k) => this.apiKeysService.serializeApiKey(k)),
        };
    }
    async getOne(req, keyId) {
        const userId = req.user._id.toString();
        const apiKey = await this.apiKeysService.getApiKey(userId, keyId);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: this.apiKeysService.serializeApiKey(apiKey),
        };
    }
    async revoke(req, keyId) {
        const userId = req.user._id.toString();
        const apiKey = await this.apiKeysService.revokeApiKey(userId, keyId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'API key revoked successfully',
            data: this.apiKeysService.serializeApiKey(apiKey),
        };
    }
    async rotate(req, keyId) {
        const userId = req.user._id.toString();
        const { apiKey, rawKey } = await this.apiKeysService.rotateApiKey(userId, keyId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'API key rotated successfully. Store the new key securely — it will not be shown again.',
            data: this.apiKeysService.serializeWithRawKey(apiKey, rawKey),
        };
    }
    async delete(req, keyId) {
        const userId = req.user._id.toString();
        await this.apiKeysService.deleteApiKey(userId, keyId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'API key deleted permanently',
        };
    }
};
exports.ApiKeysController = ApiKeysController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, index_js_1.CreateApiKeyDto]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id/revoke'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "revoke", null);
__decorate([
    (0, common_1.Patch)(':id/rotate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "rotate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "delete", null);
exports.ApiKeysController = ApiKeysController = __decorate([
    (0, common_1.Controller)('api-keys'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [api_keys_service_js_1.ApiKeysService])
], ApiKeysController);
//# sourceMappingURL=api-keys.controller.js.map