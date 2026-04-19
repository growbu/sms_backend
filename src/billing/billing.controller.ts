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
    try {
      // Extract raw body — priority chain for different environments
      let rawBody: string | Buffer;
      let bodySource: string;

      if ((req as any).rawBody) {
        rawBody = (req as any).rawBody;
        bodySource = 'req.rawBody (NestJS)';
      } else if (typeof req.body === 'string') {
        rawBody = req.body;
        bodySource = 'req.body (string)';
      } else if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
        bodySource = 'req.body (Buffer)';
      } else {
        rawBody = JSON.stringify(req.body);
        bodySource = 'JSON.stringify(req.body)';
      }

      console.log(
        `[Webhook] Body source: ${bodySource}, ` +
          `signature present: ${!!signature}, ` +
          `body length: ${rawBody.length}`,
      );

      await this.billingService.handleWebhook(rawBody, signature);
      return { received: true };
    } catch (error: any) {
      console.error('[Webhook] Error:', error?.message || error);
      return {
        statusCode: error?.status || 500,
        error: error?.message || 'Unknown webhook error',
      };
    }
  }
}
