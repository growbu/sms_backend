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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_js_1 = require("./schemas/user.schema.js");
let UserService = class UserService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async findById(id) {
        return this.userModel.findById(id).exec();
    }
    async findByEmail(email) {
        return this.userModel
            .findOne({ email: email.toLowerCase().trim() })
            .exec();
    }
    async findByGoogleId(googleId) {
        return this.userModel.findOne({ googleId }).exec();
    }
    async create(data) {
        const user = new this.userModel(data);
        return user.save();
    }
    async updateRefreshTokenHash(userId, hash) {
        await this.userModel
            .findByIdAndUpdate(userId, { refreshTokenHash: hash })
            .exec();
    }
    async updateProfile(userId, updates) {
        return this.userModel
            .findByIdAndUpdate(userId, { $set: updates }, { new: true })
            .exec();
    }
    async linkGoogleAccount(userId, googleId, avatar) {
        return this.userModel
            .findByIdAndUpdate(userId, {
            googleId,
            avatar,
            isEmailVerified: true,
        }, { new: true })
            .exec();
    }
    async incrementTrialSmsUsed(userId) {
        return this.userModel
            .findByIdAndUpdate(userId, { $inc: { trialSmsUsed: 1 } }, { new: true })
            .exec();
    }
    async updateSubscriptionStatus(userId, status, fields) {
        return this.userModel
            .findByIdAndUpdate(userId, { $set: { subscriptionStatus: status, ...fields } }, { new: true })
            .exec();
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_js_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UserService);
//# sourceMappingURL=user.service.js.map