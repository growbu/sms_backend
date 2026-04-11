import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import {
  SendMessageDto,
  UpdateMessageStatusDto,
  QueryMessagesDto,
} from './dto/index.js';

// Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard.js';
import { RequiredScopes } from '../api-keys/decorators/required-scopes.decorator.js';

// Types
import type { ApiKeyRequestContext } from '../api-keys/guards/api-key.guard.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

type ApiKeyRequest = Request & ApiKeyRequestContext;

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // ─── POST /messages/send (API key protected) ────────────────────────

  @Post('send')
  @UseGuards(ApiKeyGuard)
  @RequiredScopes('messages:send')
  async send(@Req() req: ApiKeyRequest, @Body() dto: SendMessageDto) {
    const userId = req.apiKeyUserId;
    const apiKeyId = (
      req.apiKey._id as { toString(): string }
    ).toString();

    const { message, device } = await this.messagesService.sendMessage(
      userId,
      apiKeyId,
      dto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'SMS queued for delivery',
      data: {
        ...this.messagesService.serializeMessage(message),
        device: {
          id: (device._id as { toString(): string }).toString(),
          deviceName: device.deviceName,
          phoneNumber: device.phoneNumber,
        },
      },
    };
  }

  // ─── POST /messages/dashboard-send (JWT protected — internal) ───────

  @Post('dashboard-send')
  @UseGuards(JwtAuthGuard)
  async dashboardSend(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendMessageDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();

    const { message, device } = await this.messagesService.sendFromDashboard(
      userId,
      dto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'SMS queued for delivery',
      data: {
        ...this.messagesService.serializeMessage(message),
        device: {
          id: (device._id as { toString(): string }).toString(),
          deviceName: device.deviceName,
          phoneNumber: device.phoneNumber,
        },
      },
    };
  }

  // ─── GET /messages (JWT protected — logs) ───────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryMessagesDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const result = await this.messagesService.listMessages(userId, query);

    return {
      statusCode: HttpStatus.OK,
      data: {
        messages: result.messages.map((m) =>
          this.messagesService.serializeMessage(m),
        ),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
    };
  }

  // ─── GET /messages/:id (JWT protected) ──────────────────────────────

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') messageId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const message = await this.messagesService.getMessage(userId, messageId);

    return {
      statusCode: HttpStatus.OK,
      data: this.messagesService.serializeMessage(message),
    };
  }

  // ─── POST /messages/:id/status (JWT protected — device callback) ───

  @Post(':id/status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') messageId: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const message = await this.messagesService.updateMessageStatus(
      messageId,
      userId,
      dto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Message status updated to "${message.status}"`,
      data: this.messagesService.serializeMessage(message),
    };
  }
}
