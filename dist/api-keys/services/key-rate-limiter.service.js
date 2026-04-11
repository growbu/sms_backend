"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyRateLimiterService = void 0;
const common_1 = require("@nestjs/common");
let KeyRateLimiterService = class KeyRateLimiterService {
    windows = new Map();
    cleanupInterval;
    constructor() {
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
    check(keyId, limitPerMinute) {
        const now = Date.now();
        const windowMs = 60_000;
        const entry = this.windows.get(keyId);
        if (!entry || now - entry.windowStart >= windowMs) {
            this.windows.set(keyId, { count: 1, windowStart: now });
            return true;
        }
        if (entry.count >= limitPerMinute) {
            return false;
        }
        entry.count++;
        return true;
    }
    remaining(keyId, limitPerMinute) {
        const now = Date.now();
        const windowMs = 60_000;
        const entry = this.windows.get(keyId);
        if (!entry || now - entry.windowStart >= windowMs) {
            return limitPerMinute;
        }
        return Math.max(0, limitPerMinute - entry.count);
    }
    cleanup() {
        const now = Date.now();
        const windowMs = 60_000;
        for (const [key, entry] of this.windows.entries()) {
            if (now - entry.windowStart >= windowMs * 2) {
                this.windows.delete(key);
            }
        }
    }
    onModuleDestroy() {
        clearInterval(this.cleanupInterval);
    }
};
exports.KeyRateLimiterService = KeyRateLimiterService;
exports.KeyRateLimiterService = KeyRateLimiterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], KeyRateLimiterService);
//# sourceMappingURL=key-rate-limiter.service.js.map