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
exports.MessageSchema = exports.Message = exports.MessageSource = exports.VALID_STATUS_TRANSITIONS = exports.MessageStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["QUEUED"] = "queued";
    MessageStatus["DISPATCHING"] = "dispatching";
    MessageStatus["SENDING"] = "sending";
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["FAILED"] = "failed";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
exports.VALID_STATUS_TRANSITIONS = {
    [MessageStatus.QUEUED]: [MessageStatus.DISPATCHING, MessageStatus.FAILED],
    [MessageStatus.DISPATCHING]: [MessageStatus.SENDING, MessageStatus.FAILED],
    [MessageStatus.SENDING]: [MessageStatus.SENT, MessageStatus.FAILED],
    [MessageStatus.SENT]: [MessageStatus.DELIVERED, MessageStatus.FAILED],
    [MessageStatus.DELIVERED]: [],
    [MessageStatus.FAILED]: [],
};
var MessageSource;
(function (MessageSource) {
    MessageSource["API"] = "api";
    MessageSource["DASHBOARD"] = "dashboard";
    MessageSource["MANUAL"] = "manual";
    MessageSource["SYSTEM"] = "system";
    MessageSource["CAMPAIGN"] = "campaign";
})(MessageSource || (exports.MessageSource = MessageSource = {}));
let Message = class Message {
    userId;
    apiKeyId;
    campaignId;
    deviceId;
    recipient;
    message;
    segmentsCount;
    status;
    failureReason;
    provider;
    source;
    externalRequestId;
    queuedAt;
    dispatchedAt;
    sendingAt;
    sentAt;
    deliveredAt;
    failedAt;
};
exports.Message = Message;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'ApiKey', default: null }),
    __metadata("design:type", Object)
], Message.prototype, "apiKeyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Campaign', default: null, index: true }),
    __metadata("design:type", Object)
], Message.prototype, "campaignId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Device', default: null, index: true }),
    __metadata("design:type", Object)
], Message.prototype, "deviceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], Message.prototype, "recipient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "segmentsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: MessageStatus,
        default: MessageStatus.QUEUED,
        index: true,
    }),
    __metadata("design:type", String)
], Message.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "failureReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'android_device', trim: true }),
    __metadata("design:type", String)
], Message.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: MessageSource,
        default: MessageSource.API,
        index: true,
    }),
    __metadata("design:type", String)
], Message.prototype, "source", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, trim: true, index: true }),
    __metadata("design:type", Object)
], Message.prototype, "externalRequestId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "queuedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "dispatchedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "sendingAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "sentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "deliveredAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "failedAt", void 0);
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Message);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
exports.MessageSchema.index({ userId: 1, status: 1, createdAt: -1 });
exports.MessageSchema.index({ userId: 1, recipient: 1, createdAt: -1 });
exports.MessageSchema.index({ userId: 1, source: 1, createdAt: -1 });
exports.MessageSchema.index({ userId: 1, deviceId: 1, createdAt: -1 });
exports.MessageSchema.index({ campaignId: 1, status: 1 });
//# sourceMappingURL=message.schema.js.map