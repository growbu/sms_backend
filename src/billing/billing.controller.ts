import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BillingService } from './billing.service.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import type { Request } from 'express';
import type { UserDocument } from '../user/schemas/user.schema.js';

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ─── Create Checkout Session ────────────────────────────────────────

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCheckoutDto,
    @Headers('origin') origin?: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const email = req.user.email;
    const fullName = req.user.fullName;
    const resolvedOrigin = origin || 'http://localhost:3000';

    const result = await this.billingService.createCheckoutSession(
      userId,
      email,
      fullName,
      dto.plan,
      dto.interval,
      resolvedOrigin,
    );

    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  // ─── Create Customer Portal Session ─────────────────────────────────

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPortal(
    @Req() req: AuthenticatedRequest,
    @Headers('origin') origin?: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const resolvedOrigin = origin || 'http://localhost:3000';

    const result = await this.billingService.createPortalSession(
      userId,
      resolvedOrigin,
    );

    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  // ─── Get Billing Status ─────────────────────────────────────────────

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getBillingStatus(@Req() req: AuthenticatedRequest) {
    const userId = (req.user._id as { toString(): string }).toString();
    const status = await this.billingService.getBillingStatus(userId);

    return {
      statusCode: HttpStatus.OK,
      data: status,
    };
  }

  // ─── Stripe Webhook ─────────────────────────────────────────────────

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    // Extract raw body — priority chain for different environments:
    // 1. req.rawBody (NestJS rawBody: true mode, works locally)
    // 2. req.body as string (Vercel may pass the unparsed body as a string)
    // 3. req.body as Buffer (some configurations pass Buffer directly)
    let rawBody: string | Buffer;

    if ((req as any).rawBody) {
      rawBody = (req as any).rawBody;
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else {
      // Last resort — Vercel pre-parsed JSON; re-serialize.
      // NOTE: This may fail signature verification if whitespace differs.
      rawBody = JSON.stringify(req.body);
    }

    await this.billingService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
