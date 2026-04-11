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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const messages_service_js_1 = require("./messages.service.js");
const index_js_1 = require("./dto/index.js");
const jwt_auth_guard_js_1 = require("../auth/guards/jwt-auth.guard.js");
const api_key_guard_js_1 = require("../api-keys/guards/api-key.guard.js");
const required_scopes_decorator_js_1 = require("../api-keys/decorators/required-scopes.decorator.js");
let MessagesController = class MessagesController {
    messagesService;
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    async send(req, dto) {
        const userId = req.apiKeyUserId;
        const apiKeyId = req.apiKey._id.toString();
        const { message, device } = await this.messagesService.sendMessage(userId, apiKeyId, dto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'SMS queued for delivery',
            data: {
                ...this.messagesService.serializeMessage(message),
                device: {
                    id: device._id.toString(),
                    deviceName: device.deviceName,
                    phoneNumber: device.phoneNumber,
                },
            },
        };
    }
    async dashboardSend(req, dto) {
        const userId = req.user._id.toString();
        const { message, device } = await this.messagesService.sendFromDashboard(userId, dto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'SMS queued for delivery',
            data: {
                ...this.messagesService.serializeMessage(message),
                device: {
                    id: device._id.toString(),
                    deviceName: device.deviceName,
                    phoneNumber: device.phoneNumber,
                },
            },
        };
    }
    async list(req, query) {
        const userId = req.user._id.toString();
        const result = await this.messagesService.listMessages(userId, query);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: {
                messages: result.messages.map((m) => this.messagesService.serializeMessage(m)),
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            },
        };
    }
    async getOne(req, messageId) {
        const userId = req.user._id.toString();
        const message = await this.messagesService.getMessage(userId, messageId);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: this.messagesService.serializeMessage(message),
        };
    }
    async updateStatus(req, messageId, dto) {
        const userId = req.user._id.toString();
        const message = await this.messagesService.updateMessageStatus(messageId, userId, dto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: `Message status updated to "${message.status}"`,
            data: this.messagesService.serializeMessage(message),
        };
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Post)('send'),
    (0, common_1.UseGuards)(api_key_guard_js_1.ApiKeyGuard),
    (0, required_scopes_decorator_js_1.RequiredScopes)('messages:send'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, index_js_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "send", null);
__decorate([
    (0, common_1.Post)('dashboard-send'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, index_js_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "dashboardSend", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, index_js_1.QueryMessagesDto]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, index_js_1.UpdateMessageStatusDto]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "updateStatus", null);
exports.MessagesController = MessagesController = __decorate([
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [messages_service_js_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map