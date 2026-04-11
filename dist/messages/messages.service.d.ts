import { Model } from 'mongoose';
import { MessageDocument, MessageSource } from './schemas/message.schema.js';
import { SendMessageDto, UpdateMessageStatusDto, QueryMessagesDto } from './dto/index.js';
import { DevicesService } from '../devices/devices.service.js';
import { FcmService } from './services/fcm.service.js';
import type { DeviceDocument } from '../devices/schemas/device.schema.js';
export declare class MessagesService {
    private readonly messageModel;
    private readonly devicesService;
    private readonly fcmService;
    private readonly logger;
    constructor(messageModel: Model<MessageDocument>, devicesService: DevicesService, fcmService: FcmService);
    sendMessage(userId: string, apiKeyId: string | null, dto: SendMessageDto, source?: MessageSource): Promise<{
        message: MessageDocument;
        device: DeviceDocument;
    }>;
    sendFromDashboard(userId: string, dto: SendMessageDto): Promise<{
        message: MessageDocument;
        device: DeviceDocument;
    }>;
    updateMessageStatus(messageId: string, userId: string, dto: UpdateMessageStatusDto): Promise<MessageDocument>;
    listMessages(userId: string, query: QueryMessagesDto): Promise<{
        messages: MessageDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getMessage(userId: string, messageId: string): Promise<MessageDocument>;
    serializeMessage(message: MessageDocument): {
        id: string;
        deviceId: string | null;
        recipient: unknown;
        message: unknown;
        segmentsCount: unknown;
        status: unknown;
        failureReason: unknown;
        provider: unknown;
        source: unknown;
        externalRequestId: unknown;
        queuedAt: unknown;
        dispatchedAt: unknown;
        sendingAt: unknown;
        sentAt: unknown;
        deliveredAt: unknown;
        failedAt: unknown;
        createdAt: unknown;
        updatedAt: unknown;
    };
    private selectDevice;
    private estimateSegments;
}
