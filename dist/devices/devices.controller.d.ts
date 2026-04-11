import { HttpStatus } from '@nestjs/common';
import { DevicesService } from './devices.service.js';
import { RegisterDeviceDto, UpdateFcmTokenDto, HeartbeatDto, UpdateDeviceStatusDto } from './dto/index.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: UserDocument;
}
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    register(req: AuthenticatedRequest, dto: RegisterDeviceDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            deviceId: unknown;
            deviceName: unknown;
            platform: unknown;
            brand: unknown;
            model: unknown;
            androidVersion: unknown;
            appVersion: unknown;
            fcmToken: unknown;
            simLabel: unknown;
            simSlot: unknown;
            phoneNumber: unknown;
            isActive: unknown;
            status: unknown;
            batteryLevel: unknown;
            isCharging: unknown;
            lastSeenAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    updateFcmToken(req: AuthenticatedRequest, deviceId: string, dto: UpdateFcmTokenDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            deviceId: unknown;
            deviceName: unknown;
            platform: unknown;
            brand: unknown;
            model: unknown;
            androidVersion: unknown;
            appVersion: unknown;
            fcmToken: unknown;
            simLabel: unknown;
            simSlot: unknown;
            phoneNumber: unknown;
            isActive: unknown;
            status: unknown;
            batteryLevel: unknown;
            isCharging: unknown;
            lastSeenAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    heartbeat(req: AuthenticatedRequest, deviceId: string, dto: HeartbeatDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            deviceId: unknown;
            deviceName: unknown;
            platform: unknown;
            brand: unknown;
            model: unknown;
            androidVersion: unknown;
            appVersion: unknown;
            fcmToken: unknown;
            simLabel: unknown;
            simSlot: unknown;
            phoneNumber: unknown;
            isActive: unknown;
            status: unknown;
            batteryLevel: unknown;
            isCharging: unknown;
            lastSeenAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    updateStatus(req: AuthenticatedRequest, deviceId: string, dto: UpdateDeviceStatusDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            deviceId: unknown;
            deviceName: unknown;
            platform: unknown;
            brand: unknown;
            model: unknown;
            androidVersion: unknown;
            appVersion: unknown;
            fcmToken: unknown;
            simLabel: unknown;
            simSlot: unknown;
            phoneNumber: unknown;
            isActive: unknown;
            status: unknown;
            batteryLevel: unknown;
            isCharging: unknown;
            lastSeenAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    listDevices(req: AuthenticatedRequest): Promise<{
        statusCode: HttpStatus;
        data: {
            id: string;
            deviceId: unknown;
            deviceName: unknown;
            platform: unknown;
            brand: unknown;
            model: unknown;
            isActive: unknown;
            status: unknown;
            batteryLevel: unknown;
            isCharging: unknown;
            simLabel: unknown;
            simSlot: unknown;
            lastSeenAt: unknown;
        }[];
    }>;
    getDevice(req: AuthenticatedRequest, deviceId: string): Promise<{
        statusCode: HttpStatus;
        data: {
            id: string;
            deviceId: unknown;
            deviceName: unknown;
            platform: unknown;
            brand: unknown;
            model: unknown;
            androidVersion: unknown;
            appVersion: unknown;
            fcmToken: unknown;
            simLabel: unknown;
            simSlot: unknown;
            phoneNumber: unknown;
            isActive: unknown;
            status: unknown;
            batteryLevel: unknown;
            isCharging: unknown;
            lastSeenAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
    }>;
    deleteDevice(req: AuthenticatedRequest, deviceId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
export {};
