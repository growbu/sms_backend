"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const user_service_js_1 = require("../user/user.service.js");
const user_schema_js_1 = require("../user/schemas/user.schema.js");
const subscription_service_js_1 = require("../subscription/subscription.service.js");
let AuthService = class AuthService {
    userService;
    jwtService;
    configService;
    subscriptionService;
    googleClient;
    accessSecret;
    refreshSecret;
    accessExpiresIn;
    refreshExpiresIn;
    constructor(userService, jwtService, configService, subscriptionService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.subscriptionService = subscriptionService;
        const googleClientId = this.configService.get('GOOGLE_CLIENT_ID');
        this.googleClient = new google_auth_library_1.OAuth2Client(googleClientId);
        this.accessSecret = this.configService.getOrThrow('JWT_ACCESS_SECRET');
        this.refreshSecret = this.configService.getOrThrow('JWT_REFRESH_SECRET');
        this.accessExpiresIn = this.parseDuration(this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'));
        this.refreshExpiresIn = this.parseDuration(this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'));
    }
    async signup(dto) {
        const existingUser = await this.userService.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.userService.create({
            fullName: dto.fullName.trim(),
            email: dto.email.toLowerCase().trim(),
            passwordHash,
            provider: user_schema_js_1.AuthProvider.LOCAL,
        });
        const tokens = await this.generateAndPersistTokens(user);
        return {
            user: this.buildUserProfile(user),
            tokens,
        };
    }
    async login(dto) {
        const user = await this.userService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.passwordHash) {
            throw new common_1.UnauthorizedException('This account uses Google sign-in. Please log in with Google.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const tokens = await this.generateAndPersistTokens(user);
        return {
            user: this.buildUserProfile(user),
            tokens,
        };
    }
    async googleAuth(dto) {
        const googlePayload = await this.verifyGoogleToken(dto.idToken);
        const { sub: googleId, email, name, picture } = googlePayload;
        if (!email || !googleId) {
            throw new common_1.BadRequestException('Google token does not contain required user info');
        }
        let user = await this.userService.findByGoogleId(googleId);
        if (!user) {
            const existingUser = await this.userService.findByEmail(email);
            if (existingUser) {
                user = await this.userService.linkGoogleAccount(existingUser._id.toString(), googleId, picture ?? null);
                if (!user) {
                    throw new common_1.BadRequestException('Failed to link Google account');
                }
            }
            else {
                user = await this.userService.create({
                    fullName: name ?? email.split('@')[0] ?? 'User',
                    email: email.toLowerCase().trim(),
                    passwordHash: null,
                    provider: user_schema_js_1.AuthProvider.GOOGLE,
                    googleId,
                    avatar: picture ?? null,
                    isEmailVerified: true,
                });
            }
        }
        const tokens = await this.generateAndPersistTokens(user);
        return {
            user: this.buildUserProfile(user),
            tokens,
        };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.userService.findById(userId);
        if (!user || !user.refreshTokenHash) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const isTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!isTokenValid) {
            await this.userService.updateRefreshTokenHash(user._id.toString(), null);
            throw new common_1.ForbiddenException('Access denied — please log in again');
        }
        return this.generateAndPersistTokens(user);
    }
    async logout(userId) {
        await this.userService.updateRefreshTokenHash(userId, null);
    }
    getProfile(user) {
        return this.buildUserProfile(user);
    }
    async updateProfile(userId, updates) {
        const cleanUpdates = {};
        if (updates.fullName !== undefined) {
            cleanUpdates.fullName = updates.fullName.trim();
        }
        if (updates.avatar !== undefined) {
            cleanUpdates.avatar = updates.avatar;
        }
        if (Object.keys(cleanUpdates).length === 0) {
            const user = await this.userService.findById(userId);
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            return this.buildUserProfile(user);
        }
        const user = await this.userService.updateProfile(userId, cleanUpdates);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.buildUserProfile(user);
    }
    async generateAndPersistTokens(user) {
        const userId = user._id.toString();
        const payload = {
            sub: userId,
            email: user.email,
            role: user.role,
        };
        const jwtPayload = payload;
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(jwtPayload, {
                secret: this.accessSecret,
                expiresIn: this.accessExpiresIn,
            }),
            this.jwtService.signAsync(jwtPayload, {
                secret: this.refreshSecret,
                expiresIn: this.refreshExpiresIn,
            }),
        ]);
        const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
        await this.userService.updateRefreshTokenHash(userId, refreshTokenHash);
        return { accessToken, refreshToken };
    }
    async verifyGoogleToken(idToken) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: this.configService.get('GOOGLE_CLIENT_ID'),
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Empty payload');
            }
            return payload;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired Google token');
        }
    }
    buildUserProfile(user) {
        const doc = user.toObject();
        const subscriptionInfo = this.subscriptionService.buildStatusResponse(user);
        return {
            id: user._id.toString(),
            fullName: doc.fullName,
            email: doc.email,
            provider: doc.provider,
            avatar: doc.avatar ?? null,
            role: doc.role,
            isEmailVerified: doc.isEmailVerified,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            subscription: subscriptionInfo,
        };
    }
    parseDuration(value) {
        const units = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
            w: 604800,
        };
        const match = value.match(/^(\d+)([smhdw])$/);
        if (!match) {
            return 900;
        }
        return parseInt(match[1], 10) * (units[match[2]] ?? 1);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_js_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService,
        subscription_service_js_1.SubscriptionService])
], AuthService);
//# sourceMappingURL=auth.service.js.map