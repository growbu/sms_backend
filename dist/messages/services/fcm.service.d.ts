import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface FcmSendSmsPayload {
    messageId: string;
    recipient: string;
    message: string;
    deviceId: string;
    source: string;
}
export interface FcmSendResult {
    success: boolean;
    fcmMessageId?: string;
    error?: string;
}
export declare class FcmService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    sendSmsCommand(fcmToken: string, payload: FcmSendSmsPayload): Promise<FcmSendResult>;
}
