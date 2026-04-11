export declare class KeyRateLimiterService {
    private readonly windows;
    private readonly cleanupInterval;
    constructor();
    check(keyId: string, limitPerMinute: number): boolean;
    remaining(keyId: string, limitPerMinute: number): number;
    private cleanup;
    onModuleDestroy(): void;
}
