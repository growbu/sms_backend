import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/index.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  // POST /api-keys
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateApiKeyDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const { apiKey, rawKey } = await this.apiKeysService.createApiKey(
      userId,
      dto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'API key created successfully. Store the key securely — it will not be shown again.',
      data: this.apiKeysService.serializeWithRawKey(apiKey, rawKey),
    };
  }

  // GET /api-keys
  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    const userId = (req.user._id as { toString(): string }).toString();
    const keys = await this.apiKeysService.listApiKeys(userId);
    return {
      statusCode: HttpStatus.OK,
      data: keys.map((k) => this.apiKeysService.serializeApiKey(k)),
    };
  }

  // GET /api-keys/:id
  @Get(':id')
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') keyId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const apiKey = await this.apiKeysService.getApiKey(userId, keyId);
    return {
      statusCode: HttpStatus.OK,
      data: this.apiKeysService.serializeApiKey(apiKey),
    };
  }

  // PATCH /api-keys/:id/revoke
  @Patch(':id/revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Req() req: AuthenticatedRequest,
    @Param('id') keyId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const apiKey = await this.apiKeysService.revokeApiKey(userId, keyId);
    return {
      statusCode: HttpStatus.OK,
      message: 'API key revoked successfully',
      data: this.apiKeysService.serializeApiKey(apiKey),
    };
  }

  // PATCH /api-keys/:id/rotate
  @Patch(':id/rotate')
  @HttpCode(HttpStatus.OK)
  async rotate(
    @Req() req: AuthenticatedRequest,
    @Param('id') keyId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const { apiKey, rawKey } = await this.apiKeysService.rotateApiKey(
      userId,
      keyId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'API key rotated successfully. Store the new key securely — it will not be shown again.',
      data: this.apiKeysService.serializeWithRawKey(apiKey, rawKey),
    };
  }

  // DELETE /api-keys/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id') keyId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    await this.apiKeysService.deleteApiKey(userId, keyId);
    return {
      statusCode: HttpStatus.OK,
      message: 'API key deleted permanently',
    };
  }
}
