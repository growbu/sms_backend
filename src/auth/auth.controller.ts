import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { SignupDto, LoginDto, GoogleAuthDto, RefreshTokenDto, UpdateProfileDto } from './dto/index.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';
import type { AuthTokens } from './interfaces/auth.interfaces.js';
import type { GoogleUser } from './strategies/google.strategy.js';

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const result = await this.authService.signup(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Account created successfully',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logged in successfully',
      data: result,
    };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() dto: GoogleAuthDto) {
    const result = await this.authService.googleAuth(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Google authentication successful',
      data: result,
    };
  }

  // ─── Google OAuth Redirect Flow ──────────────────────────────────────

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleRedirect(): void {
    // Passport redirects to Google — this handler body never executes
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ): Promise<void> {
    const dashboardCallbackUrl = process.env.GOOGLE_DASHBOARD_CALLBACK_URL ?? 'http://localhost:3000/api/google-callback';

    try {
      const result = await this.authService.googleOauthLogin(req.user);
      const params = new URLSearchParams({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user: JSON.stringify(result.user),
      });
      res.redirect(`${dashboardCallbackUrl}?${params.toString()}`);
    } catch {
      res.redirect(`${dashboardCallbackUrl}?error=google_auth_failed`);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() dto: RefreshTokenDto,
  ) {
    // No JwtAuthGuard here — the access token may already be expired.
    // AuthService.refreshTokens verifies the refresh token against
    // its own secret (JWT_REFRESH_SECRET) and the stored hash.
    const tokens: AuthTokens = await this.authService.refreshTokens(
      dto.refreshToken,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Tokens refreshed successfully',
      data: tokens,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest) {
    const userId = (req.user._id as { toString(): string }).toString();
    await this.authService.logout(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    const profile = this.authService.getProfile(req.user);
    return {
      statusCode: HttpStatus.OK,
      data: profile,
    };
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Req() req: AuthenticatedRequest) {
    const userId = (req.user._id as { toString(): string }).toString();
    const subscription =
      await this.subscriptionService.getSubscriptionStatus(userId);
    return {
      statusCode: HttpStatus.OK,
      data: subscription,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const profile = await this.authService.updateProfile(userId, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: profile,
    };
  }
}
