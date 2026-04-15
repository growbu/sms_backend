import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
  MessageStatus,
  MessageSource,
  VALID_STATUS_TRANSITIONS,
} from './schemas/message.schema.js';
import {
  SendMessageDto,
  UpdateMessageStatusDto,
  CallbackStatus,
  QueryMessagesDto,
} from './dto/index.js';
import { DevicesService } from '../devices/devices.service.js';
import { FcmService } from './services/fcm.service.js';
import type { DeviceDocument } from '../devices/schemas/device.schema.js';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly devicesService: DevicesService,
    private readonly fcmService: FcmService,
  ) {}

  // ─── Send SMS (API key flow) ─────────────────────────────────────────

  async sendMessage(
    userId: string,
    apiKeyId: string | null,
    dto: SendMessageDto,
    source: MessageSource = MessageSource.API,
    campaignId: string | null = null,
  ): Promise<{ message: MessageDocument; device: DeviceDocument }> {
    // 1. Select device
    const device = await this.selectDevice(userId, dto.deviceId ?? null);

    const now = new Date();

    // 2. Create message record
    const messageDoc = await this.messageModel.create({
      userId: new Types.ObjectId(userId),
      apiKeyId: apiKeyId ? new Types.ObjectId(apiKeyId) : null,
      campaignId: campaignId ? new Types.ObjectId(campaignId) : null,
      deviceId: device._id,
      recipient: dto.recipient.trim(),
      message: dto.message,
      segmentsCount: this.estimateSegments(dto.message),
      status: MessageStatus.QUEUED,
      source,
      externalRequestId: dto.externalRequestId?.trim() ?? null,
      queuedAt: now,
    });

    const messageId = (
      messageDoc._id as { toString(): string }
    ).toString();
    const deviceObjectId = (
      device._id as { toString(): string }
    ).toString();

    // 3. Dispatch via FCM
    await this.messageModel.findByIdAndUpdate(messageId, {
      status: MessageStatus.DISPATCHING,
      dispatchedAt: new Date(),
    });

    const fcmResult = await this.fcmService.sendSmsCommand(device.fcmToken, {
      messageId,
      recipient: dto.recipient.trim(),
      message: dto.message,
      deviceId: deviceObjectId,
      source,
    });

    if (!fcmResult.success) {
      // FCM failed — mark message as failed
      await this.messageModel.findByIdAndUpdate(messageId, {
        status: MessageStatus.FAILED,
        failureReason: `FCM dispatch failed: ${fcmResult.error}`,
        failedAt: new Date(),
      });

      const failedMessage = await this.messageModel
        .findById(messageId)
        .exec();

      this.logger.warn(
        `Message ${messageId} failed at FCM dispatch: ${fcmResult.error}`,
      );

      return { message: failedMessage!, device };
    }

    // FCM succeeded — message is now dispatching
    const updatedMessage = await this.messageModel
      .findById(messageId)
      .exec();

    this.logger.log(
      `Message ${messageId} dispatched to device ${deviceObjectId} via FCM`,
    );

    return { message: updatedMessage!, device };
  }

  // ─── Dashboard/Internal Send (JWT flow) ─────────────────────────────

  async sendFromDashboard(
    userId: string,
    dto: SendMessageDto,
  ): Promise<{ message: MessageDocument; device: DeviceDocument }> {
    return this.sendMessage(userId, null, dto, MessageSource.DASHBOARD);
  }

  // ─── Status Callback from Mobile App ────────────────────────────────

  async updateMessageStatus(
    messageId: string,
    userId: string,
    dto: UpdateMessageStatusDto,
  ): Promise<MessageDocument> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Message not found');
    }

    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify ownership
    if (message.userId.toString() !== userId) {
      throw new NotFoundException('Message not found');
    }

    // Validate status transition
    const currentStatus = message.status;
    const newStatus = dto.status as unknown as MessageStatus;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${dto.status}. ` +
          `Allowed transitions from "${currentStatus}": ${allowedTransitions?.join(', ') || 'none'}`,
      );
    }

    // Apply status update
    const updateFields: Record<string, unknown> = {
      status: newStatus,
    };

    if (dto.failureReason) {
      updateFields.failureReason = dto.failureReason;
    }

    // Set the corresponding timestamp
    const now = new Date();
    switch (newStatus) {
      case MessageStatus.SENDING:
        updateFields.sendingAt = now;
        break;
      case MessageStatus.SENT:
        updateFields.sentAt = now;
        break;
      case MessageStatus.DELIVERED:
        updateFields.deliveredAt = now;
        break;
      case MessageStatus.FAILED:
        updateFields.failedAt = now;
        if (dto.errorCode) {
          updateFields.failureReason =
            (dto.failureReason ?? 'Unknown error') +
            (dto.errorCode ? ` [code: ${dto.errorCode}]` : '');
        }
        break;
    }

    const updated = await this.messageModel
      .findByIdAndUpdate(messageId, { $set: updateFields }, { new: true })
      .exec();

    this.logger.log(
      `Message ${messageId} status updated: ${currentStatus} → ${dto.status}`,
    );

    return updated!;
  }

  // ─── List Messages ──────────────────────────────────────────────────

  async listMessages(
    userId: string,
    query: QueryMessagesDto,
  ): Promise<{
    messages: MessageDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.recipient) {
      filter.recipient = { $regex: query.recipient.trim(), $options: 'i' };
    }
    if (query.deviceId && Types.ObjectId.isValid(query.deviceId)) {
      filter.deviceId = new Types.ObjectId(query.deviceId);
    }
    if (query.source) {
      filter.source = query.source;
    }
    if (query.from || query.to) {
      const createdAtFilter: Record<string, Date> = {};
      if (query.from) {
        createdAtFilter.$gte = new Date(query.from);
      }
      if (query.to) {
        createdAtFilter.$lte = new Date(query.to);
      }
      filter.createdAt = createdAtFilter;
    }

    const [messages, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments(filter).exec(),
    ]);

    return {
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Get Single Message ─────────────────────────────────────────────

  async getMessage(
    userId: string,
    messageId: string,
  ): Promise<MessageDocument> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Message not found');
    }

    const message = await this.messageModel.findById(messageId).exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId.toString() !== userId) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  // ─── Response Serializer ────────────────────────────────────────────

  serializeMessage(message: MessageDocument) {
    const doc = message.toObject() as unknown as Record<string, unknown>;
    return {
      id: (message._id as { toString(): string }).toString(),
      deviceId: doc.deviceId
        ? (doc.deviceId as { toString(): string }).toString()
        : null,
      campaignId: doc.campaignId
        ? (doc.campaignId as { toString(): string }).toString()
        : null,
      recipient: doc.recipient,
      message: doc.message,
      segmentsCount: doc.segmentsCount,
      status: doc.status,
      failureReason: doc.failureReason,
      provider: doc.provider,
      source: doc.source,
      externalRequestId: doc.externalRequestId,
      queuedAt: doc.queuedAt,
      dispatchedAt: doc.dispatchedAt,
      sendingAt: doc.sendingAt,
      sentAt: doc.sentAt,
      deliveredAt: doc.deliveredAt,
      failedAt: doc.failedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  private async selectDevice(
    userId: string,
    deviceObjectId: string | null,
  ): Promise<DeviceDocument> {
    if (deviceObjectId) {
      // Explicit device — verify ownership and eligibility
      const device = await this.devicesService.getDevice(
        userId,
        deviceObjectId,
      );

      if (!device.isActive) {
        throw new BadRequestException(
          'The selected device is paused. Activate it first or omit deviceId for automatic selection.',
        );
      }

      return device;
    }

    // Auto-select best eligible device
    const device = await this.devicesService.findEligibleDevice(userId);

    if (!device) {
      throw new BadRequestException(
        'No eligible device available. Ensure at least one device is registered, active, and online.',
      );
    }

    return device;
  }

  private estimateSegments(text: string): number {
    // GSM 7-bit: 160 chars single, 153 per segment multi-part
    // UCS-2: 70 chars single, 67 per segment multi-part
    const isGsm7 = /^[\x20-\x7E\n\r]*$/.test(text);
    const singleLimit = isGsm7 ? 160 : 70;
    const multiLimit = isGsm7 ? 153 : 67;

    if (text.length <= singleLimit) {
      return 1;
    }

    return Math.ceil(text.length / multiLimit);
  }
}
