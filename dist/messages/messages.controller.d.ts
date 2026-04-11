import { HttpStatus } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { SendMessageDto, UpdateMessageStatusDto, QueryMessagesDto } from './dto/index.js';
import type { ApiKeyRequestContext } from '../api-keys/guards/api-key.guard.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: UserDocument;
}
type ApiKeyRequest = Request & ApiKeyRequestContext;
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    send(req: ApiKeyRequest, dto: SendMessageDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            device: {
                id: string;
                deviceName: string;
                phoneNumber: string | null;
            };
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
    }>;
    dashboardSend(req: AuthenticatedRequest, dto: SendMessageDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            device: {
                id: string;
                deviceName: string;
                phoneNumber: string | null;
            };
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
    }>;
    list(req: AuthenticatedRequest, query: QueryMessagesDto): Promise<{
        statusCode: HttpStatus;
        data: {
            messages: {
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
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            };
        };
    }>;
    getOne(req: AuthenticatedRequest, messageId: string): Promise<{
        statusCode: HttpStatus;
        data: {
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
    }>;
    updateStatus(req: AuthenticatedRequest, messageId: string, dto: UpdateMessageStatusDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
    }>;
}
export {};
