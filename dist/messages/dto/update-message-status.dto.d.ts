export declare enum CallbackStatus {
    SENDING = "sending",
    SENT = "sent",
    DELIVERED = "delivered",
    FAILED = "failed"
}
export declare class UpdateMessageStatusDto {
    status: CallbackStatus;
    failureReason?: string;
    deviceId?: string;
    errorCode?: string;
}
