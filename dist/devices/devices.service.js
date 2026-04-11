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
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const device_schema_js_1 = require("./schemas/device.schema.js");
let DevicesService = class DevicesService {
    deviceModel;
    constructor(deviceModel) {
        this.deviceModel = deviceModel;
    }
    async registerDevice(userId, dto) {
        const now = new Date();
        const device = await this.deviceModel.findOneAndUpdate({ deviceId: dto.deviceId }, {
            $set: {
                userId: new mongoose_2.Types.ObjectId(userId),
                deviceName: dto.deviceName.trim(),
                platform: dto.platform ?? 'android',
                brand: dto.brand?.trim() ?? null,
                model: dto.model?.trim() ?? null,
                androidVersion: dto.androidVersion?.trim() ?? null,
                appVersion: dto.appVersion?.trim() ?? null,
                fcmToken: dto.fcmToken,
                simLabel: dto.simLabel?.trim() ?? null,
                simSlot: dto.simSlot ?? null,
                phoneNumber: dto.phoneNumber?.trim() ?? null,
                status: device_schema_js_1.DeviceStatus.ONLINE,
                isActive: true,
                lastSeenAt: now,
            },
            $setOnInsert: {
                deviceId: dto.deviceId.trim(),
            },
        }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec();
        return device;
    }
    async updateFcmToken(userId, deviceObjectId, dto) {
        const device = await this.findDeviceAndVerifyOwnership(userId, deviceObjectId);
        device.fcmToken = dto.fcmToken;
        device.lastSeenAt = new Date();
        return device.save();
    }
    async heartbeat(userId, deviceObjectId, dto) {
        const device = await this.findDeviceAndVerifyOwnership(userId, deviceObjectId);
        if (dto.batteryLevel !== undefined) {
            device.batteryLevel = dto.batteryLevel;
        }
        if (dto.isCharging !== undefined) {
            device.isCharging = dto.isCharging;
        }
        if (dto.status !== undefined) {
            device.status = dto.status;
        }
        if (dto.simLabel !== undefined) {
            device.simLabel = dto.simLabel.trim();
        }
        if (dto.simSlot !== undefined) {
            device.simSlot = dto.simSlot;
        }
        device.lastSeenAt = new Date();
        return device.save();
    }
    async updateDeviceStatus(userId, deviceObjectId, dto) {
        const device = await this.findDeviceAndVerifyOwnership(userId, deviceObjectId);
        device.isActive = dto.isActive;
        device.status = dto.isActive ? device_schema_js_1.DeviceStatus.ONLINE : device_schema_js_1.DeviceStatus.PAUSED;
        device.lastSeenAt = new Date();
        return device.save();
    }
    async listDevices(userId) {
        return this.deviceModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .sort({ lastSeenAt: -1 })
            .exec();
    }
    async getDevice(userId, deviceObjectId) {
        return this.findDeviceAndVerifyOwnership(userId, deviceObjectId);
    }
    async deleteDevice(userId, deviceObjectId) {
        const device = await this.findDeviceAndVerifyOwnership(userId, deviceObjectId);
        await this.deviceModel.findByIdAndDelete(device._id).exec();
    }
    async findEligibleDevice(userId) {
        return this.deviceModel
            .findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
            isActive: true,
            status: device_schema_js_1.DeviceStatus.ONLINE,
        })
            .sort({ lastSeenAt: -1 })
            .exec();
    }
    async findDeviceAndVerifyOwnership(userId, deviceObjectId) {
        if (!mongoose_2.Types.ObjectId.isValid(deviceObjectId)) {
            throw new common_1.NotFoundException('Device not found');
        }
        const device = await this.deviceModel
            .findById(deviceObjectId)
            .exec();
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        if (device.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to access this device');
        }
        return device;
    }
    serializeDevice(device) {
        const doc = device.toObject();
        return {
            id: device._id.toString(),
            deviceId: doc.deviceId,
            deviceName: doc.deviceName,
            platform: doc.platform,
            brand: doc.brand,
            model: doc.model,
            androidVersion: doc.androidVersion,
            appVersion: doc.appVersion,
            fcmToken: doc.fcmToken,
            simLabel: doc.simLabel,
            simSlot: doc.simSlot,
            phoneNumber: doc.phoneNumber,
            isActive: doc.isActive,
            status: doc.status,
            batteryLevel: doc.batteryLevel,
            isCharging: doc.isCharging,
            lastSeenAt: doc.lastSeenAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }
    serializeDeviceSummary(device) {
        const doc = device.toObject();
        return {
            id: device._id.toString(),
            deviceId: doc.deviceId,
            deviceName: doc.deviceName,
            platform: doc.platform,
            brand: doc.brand,
            model: doc.model,
            isActive: doc.isActive,
            status: doc.status,
            batteryLevel: doc.batteryLevel,
            isCharging: doc.isCharging,
            simLabel: doc.simLabel,
            simSlot: doc.simSlot,
            lastSeenAt: doc.lastSeenAt,
        };
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(device_schema_js_1.Device.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DevicesService);
//# sourceMappingURL=devices.service.js.map