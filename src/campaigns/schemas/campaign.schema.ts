import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CampaignDocument = HydratedDocument<Campaign>;

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

/**
 * Valid forward transitions for campaign status.
 */
export const VALID_CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.DRAFT]: [CampaignStatus.SCHEDULED, CampaignStatus.PROCESSING, CampaignStatus.CANCELLED],
  [CampaignStatus.SCHEDULED]: [CampaignStatus.PROCESSING, CampaignStatus.CANCELLED],
  [CampaignStatus.PROCESSING]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED, CampaignStatus.CANCELLED, CampaignStatus.FAILED],
  [CampaignStatus.PAUSED]: [CampaignStatus.PROCESSING, CampaignStatus.CANCELLED],
  [CampaignStatus.COMPLETED]: [],
  [CampaignStatus.CANCELLED]: [],
  [CampaignStatus.FAILED]: [],
};

export enum RecipientStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Schema({ _id: false })
export class CampaignRecipient {
  @Prop({ required: true, trim: true })
  phoneNumber!: string;

  @Prop({ type: Object, default: null })
  variables!: Record<string, string> | null;

  @Prop({
    type: String,
    enum: RecipientStatus,
    default: RecipientStatus.PENDING,
  })
  status!: RecipientStatus;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  messageId!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  processedAt!: Date | null;
}

export const CampaignRecipientSchema =
  SchemaFactory.createForClass(CampaignRecipient);

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, default: null, trim: true })
  description!: string | null;

  @Prop({
    type: String,
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
    index: true,
  })
  status!: CampaignStatus;

  @Prop({ type: Types.ObjectId, ref: 'Template', default: null })
  templateId!: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  messageContentSnapshot!: string | null;

  @Prop({ type: Object, default: null })
  defaultVariables!: Record<string, string> | null;

  @Prop({ type: [CampaignRecipientSchema], default: [] })
  recipients!: CampaignRecipient[];

  @Prop({ default: 0 })
  totalRecipients!: number;

  @Prop({ default: 0 })
  validRecipients!: number;

  @Prop({ default: 0 })
  invalidRecipients!: number;

  @Prop({ default: 0 })
  duplicateRecipients!: number;

  @Prop({ default: 0 })
  sentCount!: number;

  @Prop({ default: 0 })
  failedCount!: number;

  @Prop({ default: 0 })
  deliveredCount!: number;

  @Prop({ default: 0 })
  pendingCount!: number;

  @Prop({ type: Types.ObjectId, ref: 'Device', default: null })
  deviceId!: Types.ObjectId | null;

  @Prop({ type: Date, default: null, index: true })
  scheduleAt!: Date | null;

  @Prop({ type: Date, default: null })
  startedAt!: Date | null;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;

  @Prop({ type: Date, default: null })
  pausedAt!: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt!: Date | null;

  /**
   * Tracks how far batch processing has progressed.
   * On resume, processing continues from this index.
   */
  @Prop({ default: 0 })
  processedIndex!: number;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);

// Dashboard queries
CampaignSchema.index({ userId: 1, status: 1, createdAt: -1 });
CampaignSchema.index({ userId: 1, createdAt: -1 });
// Scheduled campaign processing
CampaignSchema.index({ status: 1, scheduleAt: 1 });
