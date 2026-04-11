import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import type { MessageSource } from '../schemas/message.schema.js';

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

/**
 * Isolated FCM service for sending data-only push messages to Android devices.
 *
 * Initializes Firebase Admin SDK from either:
 *  - GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
 *  - FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY env vars
 */
@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length > 0) {
      return; // Already initialized
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          // Handle escaped newlines in env var
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      this.logger.log('Firebase Admin initialized with service account credentials');
    } else {
      // Fallback: GOOGLE_APPLICATION_CREDENTIALS env var
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      this.logger.log('Firebase Admin initialized with application default credentials');
    }
  }

  /**
   * Send a data-only FCM message to trigger SMS sending on the mobile app.
   *
   * Data-only messages (no `notification` key) ensure:
   *  - The app receives the message even in the background
   *  - The app has full control over handling
   *  - Android doze/battery optimization is respected with high priority
   */
  async sendSmsCommand(
    fcmToken: string,
    payload: FcmSendSmsPayload,
  ): Promise<FcmSendResult> {
    try {
      const fcmMessage: admin.messaging.Message = {
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
          ttl: 60 * 1000, // 60 seconds TTL
        },
      };

      const fcmMessageId = await admin.messaging().send(fcmMessage);

      this.logger.log(
        `FCM sent successfully: messageId=${payload.messageId}, fcmId=${fcmMessageId}`,
      );

      return {
        success: true,
        fcmMessageId,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown FCM error';

      this.logger.error(
        `FCM send failed: messageId=${payload.messageId}, error=${errorMessage}`,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
