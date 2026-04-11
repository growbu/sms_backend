import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignupDto, LoginDto, GoogleAuthDto, RefreshTokenDto, UpdateProfileDto } from './dto/index.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: UserDocument;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refreshTokens(req: AuthenticatedRequest, dto: RefreshTokenDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./interfaces/auth.interfaces.js").AuthTokens;
    }>;
    logout(req: AuthenticatedRequest): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getMe(req: AuthenticatedRequest): {
        statusCode: HttpStatus;
        data: import("./interfaces/auth.interfaces.js").UserProfile;
    };
    updateProfile(req: AuthenticatedRequest, dto: UpdateProfileDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./interfaces/auth.interfaces.js").UserProfile;
    }>;
}
export {};
