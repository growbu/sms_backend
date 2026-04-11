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
var MessagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_schema_js_1 = require("./schemas/message.schema.js");
const devices_service_js_1 = require("../devices/devices.service.js");
const fcm_service_js_1 = require("./services/fcm.service.js");
let MessagesService = MessagesService_1 = class MessagesService {
    messageModel;
    devicesService;
    fcmService;
    logger = new common_1.Logger(MessagesService_1.name);
    constructor(messageModel, devicesService, fcmService) {
        this.messageModel = messageModel;
        this.devicesService = devicesService;
        this.fcmService = fcmService;
    }
    async sendMessage(userId, apiKeyId, dto, source = message_schema_js_1.MessageSource.API) {
        const device = await this.selectDevice(userId, dto.deviceId ?? null);
        const now = new Date();
        const messageDoc = await this.messageModel.create({
            userId: new mongoose_2.Types.ObjectId(userId),
            apiKeyId: apiKeyId ? new mongoose_2.Types.ObjectId(apiKeyId) : null,
            deviceId: device._id,
            recipient: dto.recipient.trim(),
            message: dto.message,
            segmentsCount: this.estimateSegments(dto.message),
            status: message_schema_js_1.MessageStatus.QUEUED,
            source,
            externalRequestId: dto.externalRequestId?.trim() ?? null,
            queuedAt: now,
        });
        const messageId = messageDoc._id.toString();
        const deviceObjectId = device._id.toString();
        await this.messageModel.findByIdAndUpdate(messageId, {
            status: message_schema_js_1.MessageStatus.DISPATCHING,
            dispatchedAt: new Date(),
        });
        const fcmResult = await this.fcmService.sendSmsCommand(device.fcmToken, {
            messageId,
            recipient: dto.recipient.trim(),
            message: dto.message,
            deviceId: deviceObjectId,
            source,
        });
        if (!fcmResult.success) {
            await this.messageModel.findByIdAndUpdate(messageId, {
                status: message_schema_js_1.MessageStatus.FAILED,
                failureReason: `FCM dispatch failed: ${fcmResult.error}`,
                failedAt: new Date(),
            });
            const failedMessage = await this.messageModel
                .findById(messageId)
                .exec();
            this.logger.warn(`Message ${messageId} failed at FCM dispatch: ${fcmResult.error}`);
            return { message: failedMessage, device };
        }
        const updatedMessage = await this.messageModel
            .findById(messageId)
            .exec();
        this.logger.log(`Message ${messageId} dispatched to device ${deviceObjectId} via FCM`);
        return { message: updatedMessage, device };
    }
    async sendFromDashboard(userId, dto) {
        return this.sendMessage(userId, null, dto, message_schema_js_1.MessageSource.DASHBOARD);
    }
    async updateMessageStatus(messageId, userId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.NotFoundException('Message not found');
        }
        const message = await this.messageModel.findById(messageId).exec();
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.userId.toString() !== userId) {
            throw new common_1.NotFoundException('Message not found');
        }
        const currentStatus = message.status;
        const newStatus = dto.status;
        const allowedTransitions = message_schema_js_1.VALID_STATUS_TRANSITIONS[currentStatus];
        if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition: ${currentStatus} → ${dto.status}. ` +
                `Allowed transitions from "${currentStatus}": ${allowedTransitions?.join(', ') || 'none'}`);
        }
        const updateFields = {
            status: newStatus,
        };
        if (dto.failureReason) {
            updateFields.failureReason = dto.failureReason;
        }
        const now = new Date();
        switch (newStatus) {
            case message_schema_js_1.MessageStatus.SENDING:
                updateFields.sendingAt = now;
                break;
            case message_schema_js_1.MessageStatus.SENT:
                updateFields.sentAt = now;
                break;
            case message_schema_js_1.MessageStatus.DELIVERED:
                updateFields.deliveredAt = now;
                break;
            case message_schema_js_1.MessageStatus.FAILED:
                updateFields.failedAt = now;
                if (dto.errorCode) {
                    updateFields.failureReason =
                        (dto.failureReason ?? 'Unknown error') +
                            (dto.errorCode ? ` [code: ${dto.errorCode}]` : '');
                }
                break;
        }
        const updated = await this.messageModel
            .findByIdAndUpdate(messageId, { $set: updateFields }, { new: true })
            .exec();
        this.logger.log(`Message ${messageId} status updated: ${currentStatus} → ${dto.status}`);
        return updated;
    }
    async listMessages(userId, query) {
        const page = Math.max(1, parseInt(query.page ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
        const skip = (page - 1) * limit;
        const filter = {
            userId: new mongoose_2.Types.ObjectId(userId),
        };
        if (query.status) {
            filter.status = query.status;
        }
        if (query.recipient) {
            filter.recipient = { $regex: query.recipient.trim(), $options: 'i' };
        }
        if (query.deviceId && mongoose_2.Types.ObjectId.isValid(query.deviceId)) {
            filter.deviceId = new mongoose_2.Types.ObjectId(query.deviceId);
        }
        if (query.source) {
            filter.source = query.source;
        }
        if (query.from || query.to) {
            const createdAtFilter = {};
            if (query.from) {
                createdAtFilter.$gte = new Date(query.from);
            }
            if (query.to) {
                createdAtFilter.$lte = new Date(query.to);
            }
            filter.createdAt = createdAtFilter;
        }
        const [messages, total] = await Promise.all([
            this.messageModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.messageModel.countDocuments(filter).exec(),
        ]);
        return {
            messages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getMessage(userId, messageId) {
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.NotFoundException('Message not found');
        }
        const message = await this.messageModel.findById(messageId).exec();
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.userId.toString() !== userId) {
            throw new common_1.NotFoundException('Message not found');
        }
        return message;
    }
    serializeMessage(message) {
        const doc = message.toObject();
        return {
            id: message._id.toString(),
            deviceId: doc.deviceId
                ? doc.deviceId.toString()
                : null,
            recipient: doc.recipient,
            message: doc.message,
            segmentsCount: doc.segmentsCount,
            status: doc.status,
            failureReason: doc.failureReason,
            provider: doc.provider,
            source: doc.source,
            externalRequestId: doc.externalRequestId,
            queuedAt: doc.queuedAt,
            dispatchedAt: doc.dispatchedAt,
            sendingAt: doc.sendingAt,
            sentAt: doc.sentAt,
            deliveredAt: doc.deliveredAt,
            failedAt: doc.failedAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }
    async selectDevice(userId, deviceObjectId) {
        if (deviceObjectId) {
            const device = await this.devicesService.getDevice(userId, deviceObjectId);
            if (!device.isActive) {
                throw new common_1.BadRequestException('The selected device is paused. Activate it first or omit deviceId for automatic selection.');
            }
            return device;
        }
        const device = await this.devicesService.findEligibleDevice(userId);
        if (!device) {
            throw new common_1.BadRequestException('No eligible device available. Ensure at least one device is registered, active, and online.');
        }
        return device;
    }
    estimateSegments(text) {
        const isGsm7 = /^[\x20-\x7E\n\r]*$/.test(text);
        const singleLimit = isGsm7 ? 160 : 70;
        const multiLimit = isGsm7 ? 153 : 67;
        if (text.length <= singleLimit) {
            return 1;
        }
        return Math.ceil(text.length / multiLimit);
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = MessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_js_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        devices_service_js_1.DevicesService,
        fcm_service_js_1.FcmService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map