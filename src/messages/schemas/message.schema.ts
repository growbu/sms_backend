import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageStatus {
  QUEUED = 'queued',
  DISPATCHING = 'dispatching',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

/**
 * Valid forward transitions for message status.
 * Prevents invalid backwards jumps (e.g., sent → queued).
 */
export const VALID_STATUS_TRANSITIONS: Record<MessageStatus, MessageStatus[]> = {
  [MessageStatus.QUEUED]: [MessageStatus.DISPATCHING, MessageStatus.FAILED],
  [MessageStatus.DISPATCHING]: [MessageStatus.SENDING, MessageStatus.FAILED],
  [MessageStatus.SENDING]: [MessageStatus.SENT, MessageStatus.FAILED],
  [MessageStatus.SENT]: [MessageStatus.DELIVERED, MessageStatus.FAILED],
  [MessageStatus.DELIVERED]: [],
  [MessageStatus.FAILED]: [],
};

export enum MessageSource {
  API = 'api',
  DASHBOARD = 'dashboard',
  MANUAL = 'manual',
  SYSTEM = 'system',
  CAMPAIGN = 'campaign',
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ApiKey', default: null })
  apiKeyId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', default: null, index: true })
  campaignId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Device', default: null, index: true })
  deviceId!: Types.ObjectId | null;

  @Prop({ required: true, trim: true, index: true })
  recipient!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: Number, default: null })
  segmentsCount!: number | null;

  @Prop({
    type: String,
    enum: MessageStatus,
    default: MessageStatus.QUEUED,
    index: true,
  })
  status!: MessageStatus;

  @Prop({ type: String, default: null })
  failureReason!: string | null;

  @Prop({ default: 'android_device', trim: true })
  provider!: string;

  @Prop({
    type: String,
    enum: MessageSource,
    default: MessageSource.API,
    index: true,
  })
  source!: MessageSource;

  @Prop({ type: String, default: null, trim: true, index: true })
  externalRequestId!: string | null;

  @Prop({ type: Date, default: null })
  queuedAt!: Date | null;

  @Prop({ type: Date, default: null })
  dispatchedAt!: Date | null;

  @Prop({ type: Date, default: null })
  sendingAt!: Date | null;

  @Prop({ type: Date, default: null })
  sentAt!: Date | null;

  @Prop({ type: Date, default: null })
  deliveredAt!: Date | null;

  @Prop({ type: Date, default: null })
  failedAt!: Date | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound indexes for common query patterns
MessageSchema.index({ userId: 1, status: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, source: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, deviceId: 1, createdAt: -1 });
MessageSchema.index({ campaignId: 1, status: 1 });
