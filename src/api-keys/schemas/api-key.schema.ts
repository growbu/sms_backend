import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

export const API_KEY_SCOPES = [
  'messages:send',
  'messages:read',
  'devices:read',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, index: true })
  prefix!: string;

  @Prop({ required: true, index: true })
  keyHash!: string;

  @Prop({ type: [String], default: ['messages:send'] })
  scopes!: string[];

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  lastUsedAt!: Date | null;

  @Prop({ type: String, default: null, trim: true })
  lastUsedIp!: string | null;

  @Prop({ default: 0 })
  requestCount!: number;

  @Prop({ type: Number, default: null })
  rateLimitPerMinute!: number | null;

  @Prop({ type: Date, default: null, index: true })
  expiresAt!: Date | null;

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Compound index for fast validation lookups
ApiKeySchema.index({ keyHash: 1, isActive: 1 });
ApiKeySchema.index({ userId: 1, isActive: 1 });
