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
exports.UpdateMessageStatusDto = exports.CallbackStatus = void 0;
const class_validator_1 = require("class-validator");
var CallbackStatus;
(function (CallbackStatus) {
    CallbackStatus["SENDING"] = "sending";
    CallbackStatus["SENT"] = "sent";
    CallbackStatus["DELIVERED"] = "delivered";
    CallbackStatus["FAILED"] = "failed";
})(CallbackStatus || (exports.CallbackStatus = CallbackStatus = {}));
class UpdateMessageStatusDto {
    status;
    failureReason;
    deviceId;
    errorCode;
}
exports.UpdateMessageStatusDto = UpdateMessageStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(CallbackStatus, {
        message: 'status must be one of: sending, sent, delivered, failed',
    }),
    __metadata("design:type", String)
], UpdateMessageStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageStatusDto.prototype, "failureReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageStatusDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageStatusDto.prototype, "errorCode", void 0);
//# sourceMappingURL=update-message-status.dto.js.map