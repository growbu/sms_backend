"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FcmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = __importStar(require("firebase-admin"));
let FcmService = FcmService_1 = class FcmService {
    configService;
    logger = new common_1.Logger(FcmService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        if (admin.apps.length > 0) {
            return;
        }
        const projectId = this.configService.get('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');
        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            this.logger.log('Firebase Admin initialized with service account credentials');
        }
        else {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            this.logger.log('Firebase Admin initialized with application default credentials');
        }
    }
    async sendSmsCommand(fcmToken, payload) {
        try {
            const fcmMessage = {
                token: fcmToken,
                data: {
                    type: 'SEND_SMS',
                    messageId: payload.messageId,
                    recipient: payload.recipient,
                    message: payload.message,
                    deviceId: payload.deviceId,
                    source: payload.source,
                    timestamp: new Date().toISOString(),
                },
                android: {
                    priority: 'high',
                    ttl: 60 * 1000,
                },
            };
            const fcmMessageId = await admin.messaging().send(fcmMessage);
            this.logger.log(`FCM sent successfully: messageId=${payload.messageId}, fcmId=${fcmMessageId}`);
            return {
                success: true,
                fcmMessageId,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown FCM error';
            this.logger.error(`FCM send failed: messageId=${payload.messageId}, error=${errorMessage}`);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
};
exports.FcmService = FcmService;
exports.FcmService = FcmService = FcmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FcmService);
//# sourceMappingURL=fcm.service.js.map