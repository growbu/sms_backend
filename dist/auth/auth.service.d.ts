import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service.js';
import { UserDocument } from '../user/schemas/user.schema.js';
import { SignupDto, LoginDto, GoogleAuthDto } from './dto/index.js';
import type { AuthResponse, AuthTokens, UserProfile } from './interfaces/auth.interfaces.js';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    private readonly configService;
    private readonly googleClient;
    private readonly accessSecret;
    private readonly refreshSecret;
    private readonly accessExpiresIn;
    private readonly refreshExpiresIn;
    constructor(userService: UserService, jwtService: JwtService, configService: ConfigService);
    signup(dto: SignupDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    googleAuth(dto: GoogleAuthDto): Promise<AuthResponse>;
    refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    getProfile(user: UserDocument): UserProfile;
    updateProfile(userId: string, updates: {
        fullName?: string;
        avatar?: string;
    }): Promise<UserProfile>;
    private generateAndPersistTokens;
    private verifyGoogleToken;
    private buildUserProfile;
    private parseDuration;
}
