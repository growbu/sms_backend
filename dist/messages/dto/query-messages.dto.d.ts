import { MessageStatus, MessageSource } from '../schemas/message.schema.js';
export declare class QueryMessagesDto {
    status?: MessageStatus;
    recipient?: string;
    deviceId?: string;
    source?: MessageSource;
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
}
