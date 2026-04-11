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
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_js_1 = require("../auth/guards/jwt-auth.guard.js");
const devices_service_js_1 = require("./devices.service.js");
const index_js_1 = require("./dto/index.js");
let DevicesController = class DevicesController {
    devicesService;
    constructor(devicesService) {
        this.devicesService = devicesService;
    }
    async register(req, dto) {
        const userId = req.user._id.toString();
        const device = await this.devicesService.registerDevice(userId, dto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Device registered successfully',
            data: this.devicesService.serializeDevice(device),
        };
    }
    async updateFcmToken(req, deviceId, dto) {
        const userId = req.user._id.toString();
        const device = await this.devicesService.updateFcmToken(userId, deviceId, dto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'FCM token updated successfully',
            data: this.devicesService.serializeDevice(device),
        };
    }
    async heartbeat(req, deviceId, dto) {
        const userId = req.user._id.toString();
        const device = await this.devicesService.heartbeat(userId, deviceId, dto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Heartbeat recorded',
            data: this.devicesService.serializeDevice(device),
        };
    }
    async updateStatus(req, deviceId, dto) {
        const userId = req.user._id.toString();
        const device = await this.devicesService.updateDeviceStatus(userId, deviceId, dto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: dto.isActive
                ? 'Device activated successfully'
                : 'Device paused successfully',
            data: this.devicesService.serializeDevice(device),
        };
    }
    async listDevices(req) {
        const userId = req.user._id.toString();
        const devices = await this.devicesService.listDevices(userId);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: devices.map((d) => this.devicesService.serializeDeviceSummary(d)),
        };
    }
    async getDevice(req, deviceId) {
        const userId = req.user._id.toString();
        const device = await this.devicesService.getDevice(userId, deviceId);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: this.devicesService.serializeDevice(device),
        };
    }
    async deleteDevice(req, deviceId) {
        const userId = req.user._id.toString();
        await this.devicesService.deleteDevice(userId, deviceId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Device removed successfully',
        };
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, index_js_1.RegisterDeviceDto]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "register", null);
__decorate([
    (0, common_1.Patch)(':id/fcm-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, index_js_1.UpdateFcmTokenDto]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "updateFcmToken", null);
__decorate([
    (0, common_1.Patch)(':id/heartbeat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, index_js_1.HeartbeatDto]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, index_js_1.UpdateDeviceStatusDto]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "listDevices", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getDevice", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "deleteDevice", null);
exports.DevicesController = DevicesController = __decorate([
    (0, common_1.Controller)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [devices_service_js_1.DevicesService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map