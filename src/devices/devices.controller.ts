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
import { DevicesService } from './devices.service.js';
import {
  RegisterDeviceDto,
  UpdateFcmTokenDto,
  HeartbeatDto,
  UpdateDeviceStatusDto,
} from './dto/index.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  // POST /devices/register
  @Post('register')
  async register(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RegisterDeviceDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const device = await this.devicesService.registerDevice(userId, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Device registered successfully',
      data: this.devicesService.serializeDevice(device),
    };
  }

  // PATCH /devices/:id/fcm-token
  @Patch(':id/fcm-token')
  @HttpCode(HttpStatus.OK)
  async updateFcmToken(
    @Req() req: AuthenticatedRequest,
    @Param('id') deviceId: string,
    @Body() dto: UpdateFcmTokenDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const device = await this.devicesService.updateFcmToken(
      userId,
      deviceId,
      dto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'FCM token updated successfully',
      data: this.devicesService.serializeDevice(device),
    };
  }

  // PATCH /devices/:id/heartbeat
  @Patch(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(
    @Req() req: AuthenticatedRequest,
    @Param('id') deviceId: string,
    @Body() dto: HeartbeatDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const device = await this.devicesService.heartbeat(userId, deviceId, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Heartbeat recorded',
      data: this.devicesService.serializeDevice(device),
    };
  }

  // PATCH /devices/:id/status
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') deviceId: string,
    @Body() dto: UpdateDeviceStatusDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const device = await this.devicesService.updateDeviceStatus(
      userId,
      deviceId,
      dto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: dto.isActive
        ? 'Device activated successfully'
        : 'Device paused successfully',
      data: this.devicesService.serializeDevice(device),
    };
  }

  // GET /devices
  @Get()
  async listDevices(@Req() req: AuthenticatedRequest) {
    const userId = (req.user._id as { toString(): string }).toString();
    const devices = await this.devicesService.listDevices(userId);
    return {
      statusCode: HttpStatus.OK,
      data: devices.map((d) => this.devicesService.serializeDeviceSummary(d)),
    };
  }

  // GET /devices/:id
  @Get(':id')
  async getDevice(
    @Req() req: AuthenticatedRequest,
    @Param('id') deviceId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const device = await this.devicesService.getDevice(userId, deviceId);
    return {
      statusCode: HttpStatus.OK,
      data: this.devicesService.serializeDevice(device),
    };
  }

  // DELETE /devices/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteDevice(
    @Req() req: AuthenticatedRequest,
    @Param('id') deviceId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    await this.devicesService.deleteDevice(userId, deviceId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Device removed successfully',
    };
  }
}
