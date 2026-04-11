export declare enum HeartbeatStatus {
    ONLINE = "online",
    OFFLINE = "offline"
}
export declare class HeartbeatDto {
    batteryLevel?: number;
    isCharging?: boolean;
    status?: HeartbeatStatus;
    simLabel?: string;
    simSlot?: number;
}
