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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_js_1 = require("./auth.service.js");
const index_js_1 = require("./dto/index.js");
const jwt_auth_guard_js_1 = require("./guards/jwt-auth.guard.js");
const subscription_service_js_1 = require("../subscription/subscription.service.js");
let AuthController = class AuthController {
    authService;
    subscriptionService;
    constructor(authService, subscriptionService) {
        this.authService = authService;
        this.subscriptionService = subscriptionService;
    }
    async signup(dto) {
        const result = await this.authService.signup(dto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Account created successfully',
            data: result,
        };
    }
    async login(dto) {
        const result = await this.authService.login(dto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Logged in successfully',
            data: result,
        };
    }
    async googleAuth(dto) {
        const result = await this.authService.googleAuth(dto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Google authentication successful',
            data: result,
        };
    }
    googleRedirect() {
    }
    async googleCallback(req, res) {
        const dashboardCallbackUrl = process.env.GOOGLE_DASHBOARD_CALLBACK_URL ?? 'http://localhost:3000/api/google-callback';
        try {
            const result = await this.authService.googleOauthLogin(req.user);
            const params = new URLSearchParams({
                accessToken: result.tokens.accessToken,
                refreshToken: result.tokens.refreshToken,
                user: JSON.stringify(result.user),
            });
            res.redirect(`${dashboardCallbackUrl}?${params.toString()}`);
        }
        catch {
            res.redirect(`${dashboardCallbackUrl}?error=google_auth_failed`);
        }
    }
    async refreshTokens(dto) {
        const tokens = await this.authService.refreshTokens(dto.refreshToken);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Tokens refreshed successfully',
            data: tokens,
        };
    }
    async logout(req) {
        const userId = req.user._id.toString();
        await this.authService.logout(userId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Logged out successfully',
        };
    }
    getMe(req) {
        const profile = this.authService.getProfile(req.user);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: profile,
        };
    }
    async getSubscription(req) {
        const userId = req.user._id.toString();
        const subscription = await this.subscriptionService.getSubscriptionStatus(userId);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: subscription,
        };
    }
    async updateProfile(req, dto) {
        const userId = req.user._id.toString();
        const profile = await this.authService.updateProfile(userId, dto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Profile updated successfully',
            data: profile,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_js_1.SignupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_js_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('google'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_js_1.GoogleAuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/redirect'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleRedirect", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_js_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('subscription'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, index_js_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService,
        subscription_service_js_1.SubscriptionService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map