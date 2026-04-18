import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReceivedMessagesService } from './received-messages.service.js';
import {
  CreateReceivedMessageDto,
  QueryReceivedMessagesDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@Controller('received-messages')
@UseGuards(JwtAuthGuard)
export class ReceivedMessagesController {
  constructor(
    private readonly receivedMessagesService: ReceivedMessagesService,
  ) {}

  // ─── POST /received-messages (device callback — stores incoming SMS) ──

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateReceivedMessageDto,
  ) {
    const userId = (
      req.user._id as { toString(): string }
    ).toString();
    const doc = await this.receivedMessagesService.create(userId, dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Received SMS stored',
      data: this.receivedMessagesService.serialize(doc),
    };
  }

  // ─── GET /received-messages (paginated list) ──────────────────────────

  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryReceivedMessagesDto,
  ) {
    const userId = (
      req.user._id as { toString(): string }
    ).toString();
    const result = await this.receivedMessagesService.list(userId, query);

    return {
      statusCode: HttpStatus.OK,
      data: {
        messages: result.messages.map((m) =>
          this.receivedMessagesService.serialize(m),
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

  // ─── GET /received-messages/:id ───────────────────────────────────────

  @Get(':id')
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') messageId: string,
  ) {
    const userId = (
      req.user._id as { toString(): string }
    ).toString();
    const doc = await this.receivedMessagesService.getOne(userId, messageId);

    return {
      statusCode: HttpStatus.OK,
      data: this.receivedMessagesService.serialize(doc),
    };
  }
}
