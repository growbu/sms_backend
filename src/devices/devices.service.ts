import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Device,
  DeviceDocument,
  DeviceStatus,
} from './schemas/device.schema.js';
import {
  RegisterDeviceDto,
  UpdateFcmTokenDto,
  HeartbeatDto,
  UpdateDeviceStatusDto,
} from './dto/index.js';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  // ─── Register / Upsert Device ────────────────────────────────────────

  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
  ): Promise<DeviceDocument> {
    const now = new Date();

    const device = await this.deviceModel.findOneAndUpdate(
      { deviceId: dto.deviceId },
      {
        $set: {
          userId: new Types.ObjectId(userId),
          deviceName: dto.deviceName.trim(),
          platform: dto.platform ?? 'android',
          brand: dto.brand?.trim() ?? null,
          model: dto.model?.trim() ?? null,
          androidVersion: dto.androidVersion?.trim() ?? null,
          appVersion: dto.appVersion?.trim() ?? null,
          fcmToken: dto.fcmToken,
          simLabel: dto.simLabel?.trim() ?? null,
          simSlot: dto.simSlot ?? null,
          phoneNumber: dto.phoneNumber?.trim() ?? null,
          status: DeviceStatus.ONLINE,
          isActive: true,
          lastSeenAt: now,
        },
        $setOnInsert: {
          deviceId: dto.deviceId.trim(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    return device!;
  }

  // ─── Update FCM Token ────────────────────────────────────────────────

  async updateFcmToken(
    userId: string,
    deviceObjectId: string,
    dto: UpdateFcmTokenDto,
  ): Promise<DeviceDocument> {
    const device = await this.findDeviceAndVerifyOwnership(
      userId,
      deviceObjectId,
    );

    device.fcmToken = dto.fcmToken;
    device.lastSeenAt = new Date();
    return device.save();
  }

  // ─── Heartbeat / Presence ────────────────────────────────────────────

  async heartbeat(
    userId: string,
    deviceObjectId: string,
    dto: HeartbeatDto,
  ): Promise<DeviceDocument> {
    const device = await this.findDeviceAndVerifyOwnership(
      userId,
      deviceObjectId,
    );

    if (dto.batteryLevel !== undefined) {
      device.batteryLevel = dto.batteryLevel;
    }
    if (dto.isCharging !== undefined) {
      device.isCharging = dto.isCharging;
    }
    if (dto.status !== undefined) {
      // Only allow online/offline via heartbeat; paused is set via status endpoint
      device.status = dto.status as unknown as DeviceStatus;
    }
    if (dto.simLabel !== undefined) {
      device.simLabel = dto.simLabel.trim();
    }
    if (dto.simSlot !== undefined) {
      device.simSlot = dto.simSlot;
    }

    device.lastSeenAt = new Date();
    return device.save();
  }

  // ─── Pause / Activate ───────────────────────────────────────────────

  async updateDeviceStatus(
    userId: string,
    deviceObjectId: string,
    dto: UpdateDeviceStatusDto,
  ): Promise<DeviceDocument> {
    const device = await this.findDeviceAndVerifyOwnership(
      userId,
      deviceObjectId,
    );

    device.isActive = dto.isActive;
    device.status = dto.isActive ? DeviceStatus.ONLINE : DeviceStatus.PAUSED;
    device.lastSeenAt = new Date();
    return device.save();
  }

  // ─── List User Devices ──────────────────────────────────────────────

  async listDevices(userId: string): Promise<DeviceDocument[]> {
    return this.deviceModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ lastSeenAt: -1 })
      .exec();
  }

  // ─── Get Single Device ──────────────────────────────────────────────

  async getDevice(
    userId: string,
    deviceObjectId: string,
  ): Promise<DeviceDocument> {
    return this.findDeviceAndVerifyOwnership(userId, deviceObjectId);
  }

  // ─── Delete Device ──────────────────────────────────────────────────

  async deleteDevice(
    userId: string,
    deviceObjectId: string,
  ): Promise<void> {
    const device = await this.findDeviceAndVerifyOwnership(
      userId,
      deviceObjectId,
    );
    await this.deviceModel.findByIdAndDelete(device._id).exec();
  }

  // ─── Eligible Device for Messaging (helper) ─────────────────────────

  /**
   * Returns the best eligible device for sending an SMS on behalf of a user.
   *
   * Selection criteria:
   *  - belongs to the given user
   *  - isActive === true
   *  - status === 'online'
   *  - ordered by lastSeenAt descending (most recently seen first)
   *
   * Returns null if no eligible device is found.
   */
  async findEligibleDevice(userId: string): Promise<DeviceDocument | null> {
    return this.deviceModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isActive: true,
        status: DeviceStatus.ONLINE,
      })
      .sort({ lastSeenAt: -1 })
      .exec();
  }

  // ─── Ownership Check Helper ─────────────────────────────────────────

  private async findDeviceAndVerifyOwnership(
    userId: string,
    deviceObjectId: string,
  ): Promise<DeviceDocument> {
    if (!Types.ObjectId.isValid(deviceObjectId)) {
      throw new NotFoundException('Device not found');
    }

    const device = await this.deviceModel
      .findById(deviceObjectId)
      .exec();

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this device',
      );
    }

    return device;
  }

  // ─── Response Serializer ────────────────────────────────────────────

  serializeDevice(device: DeviceDocument) {
    const doc = device.toObject() as unknown as Record<string, unknown>;
    return {
      id: (device._id as { toString(): string }).toString(),
      deviceId: doc.deviceId,
      deviceName: doc.deviceName,
      platform: doc.platform,
      brand: doc.brand,
      model: doc.model,
      androidVersion: doc.androidVersion,
      appVersion: doc.appVersion,
      fcmToken: doc.fcmToken,
      simLabel: doc.simLabel,
      simSlot: doc.simSlot,
      phoneNumber: doc.phoneNumber,
      isActive: doc.isActive,
      status: doc.status,
      batteryLevel: doc.batteryLevel,
      isCharging: doc.isCharging,
      lastSeenAt: doc.lastSeenAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  serializeDeviceSummary(device: DeviceDocument) {
    const doc = device.toObject() as unknown as Record<string, unknown>;
    return {
      id: (device._id as { toString(): string }).toString(),
      deviceId: doc.deviceId,
      deviceName: doc.deviceName,
      platform: doc.platform,
      brand: doc.brand,
      model: doc.model,
      isActive: doc.isActive,
      status: doc.status,
      batteryLevel: doc.batteryLevel,
      isCharging: doc.isCharging,
      simLabel: doc.simLabel,
      simSlot: doc.simSlot,
      lastSeenAt: doc.lastSeenAt,
    };
  }
}
