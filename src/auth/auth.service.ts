import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { UserService } from '../user/user.service.js';
import { UserDocument, AuthProvider } from '../user/schemas/user.schema.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { SignupDto, LoginDto, GoogleAuthDto } from './dto/index.js';
import type {
  AuthResponse,
  AuthTokens,
  JwtPayload,
  UserProfile,
} from './interfaces/auth.interfaces.js';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: number | null;
  private readonly refreshExpiresIn: number;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(googleClientId);

    this.accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessExpiresIn = this.parseDuration(this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '365d'));
    this.refreshExpiresIn = this.parseDuration(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '365d')) ?? 31536000;
  }

  // ─── Email/Password Signup ───────────────────────────────────────────

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userService.create({
      fullName: dto.fullName.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      provider: AuthProvider.LOCAL,
    });

    const tokens = await this.generateAndPersistTokens(user);

    return {
      user: this.buildUserProfile(user),
      tokens,
    };
  }

  // ─── Email/Password Login ────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please log in with Google.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateAndPersistTokens(user);

    return {
      user: this.buildUserProfile(user),
      tokens,
    };
  }

  // ─── Google Sign-In ──────────────────────────────────────────────────

  async googleAuth(dto: GoogleAuthDto): Promise<AuthResponse> {
    const googlePayload = await this.verifyGoogleToken(dto.idToken);

    const { sub: googleId, email, name, picture } = googlePayload;
    if (!email || !googleId) {
      throw new BadRequestException('Google token does not contain required user info');
    }

    // 1. Check if user exists by Google ID
    let user = await this.userService.findByGoogleId(googleId);

    if (!user) {
      // 2. Check if email is already registered (local account)
      const existingUser = await this.userService.findByEmail(email);

      if (existingUser) {
        // Link Google to existing local account
        user = await this.userService.linkGoogleAccount(
          (existingUser._id as { toString(): string }).toString(),
          googleId,
          picture ?? null,
        );

        if (!user) {
          throw new BadRequestException('Failed to link Google account');
        }
      } else {
        // 3. Create new Google-only user
        user = await this.userService.create({
          fullName: name ?? email.split('@')[0] ?? 'User',
          email: email.toLowerCase().trim(),
          passwordHash: null,
          provider: AuthProvider.GOOGLE,
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

  // ─── Refresh Tokens ──────────────────────────────────────────────────

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.userService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Access denied');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isTokenValid) {
      // Potential token reuse detected — clear all refresh tokens
      await this.userService.updateRefreshTokenHash(
        (user._id as { toString(): string }).toString(),
        null,
      );
      throw new ForbiddenException('Access denied — please log in again');
    }

    return this.generateAndPersistTokens(user);
  }

  // ─── Logout ──────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.userService.updateRefreshTokenHash(userId, null);
  }

  // ─── Get Current User ────────────────────────────────────────────────

  getProfile(user: UserDocument): UserProfile {
    return this.buildUserProfile(user);
  }

  // ─── Update Profile ─────────────────────────────────────────────────

  async updateProfile(
    userId: string,
    updates: { fullName?: string; avatar?: string },
  ): Promise<UserProfile> {
    const cleanUpdates: Record<string, string> = {};

    if (updates.fullName !== undefined) {
      cleanUpdates.fullName = updates.fullName.trim();
    }
    if (updates.avatar !== undefined) {
      cleanUpdates.avatar = updates.avatar;
    }

    if (Object.keys(cleanUpdates).length === 0) {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.buildUserProfile(user);
    }

    const user = await this.userService.updateProfile(userId, cleanUpdates);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.buildUserProfile(user);
  }

  // ─── Private Helpers ─────────────────────────────────────────────────

  private async generateAndPersistTokens(user: UserDocument): Promise<AuthTokens> {
    const userId = (user._id as { toString(): string }).toString();

    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      role: user.role,
    };

    const jwtPayload = payload as unknown as Record<string, unknown>;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.accessSecret,
        ...(this.accessExpiresIn !== null ? { expiresIn: this.accessExpiresIn } : {}),
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn,
      }),
    ]);

    // Store only a hashed version of the refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.userService.updateRefreshTokenHash(userId, refreshTokenHash);

    return { accessToken, refreshToken };
  }

  private async verifyGoogleToken(idToken: string): Promise<TokenPayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Empty payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired Google token');
    }
  }

  private buildUserProfile(user: UserDocument): UserProfile {
    const doc = user.toObject() as unknown as Record<string, unknown>;
    const subscriptionInfo = this.subscriptionService.buildStatusResponse(user);
    return {
      id: (user._id as { toString(): string }).toString(),
      fullName: doc.fullName as string,
      email: doc.email as string,
      provider: doc.provider as string,
      avatar: (doc.avatar as string) ?? null,
      role: doc.role as string,
      isEmailVerified: doc.isEmailVerified as boolean,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
      subscription: subscriptionInfo,
    };
  }

  private parseDuration(value: string): number | null {
    if (value === '0' || value === 'never') {
      return null; // null means no expiry — the exp claim is omitted from the JWT
    }
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
    };
    const match = value.match(/^(\d+)([smhdw])$/);
    if (!match) {
      return null; // unrecognised format → no expiry
    }
    return parseInt(match[1]!, 10) * (units[match[2]!] ?? 1);
  }
}
