import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignupDto, LoginDto, GoogleAuthDto, RefreshTokenDto, UpdateProfileDto } from './dto/index.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';
import type { AuthTokens } from './interfaces/auth.interfaces.js';
interface AuthenticatedRequest extends Request {
    user: UserDocument;
}
export declare class AuthController {
    private readonly authService;
    private readonly subscriptionService;
    constructor(authService: AuthService, subscriptionService: SubscriptionService);
    signup(dto: SignupDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./interfaces/auth.interfaces.js").AuthResponse;
    }>;
    login(dto: LoginDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./interfaces/auth.interfaces.js").AuthResponse;
    }>;
    googleAuth(dto: GoogleAuthDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./interfaces/auth.interfaces.js").AuthResponse;
    }>;
    refreshTokens(dto: RefreshTokenDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: AuthTokens;
    }>;
    logout(req: AuthenticatedRequest): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getMe(req: AuthenticatedRequest): {
        statusCode: HttpStatus;
        data: import("./interfaces/auth.interfaces.js").UserProfile;
    };
    getSubscription(req: AuthenticatedRequest): Promise<{
        statusCode: HttpStatus;
        data: import("../subscription/subscription.service.js").SubscriptionStatusResponse;
    }>;
    updateProfile(req: AuthenticatedRequest, dto: UpdateProfileDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./interfaces/auth.interfaces.js").UserProfile;
    }>;
}
export {};
