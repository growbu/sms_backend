import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  PAUSED = 'paused',
}

@Schema({ timestamps: true })
export class Device {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true, index: true })
  deviceId!: string;

  @Prop({ required: true, trim: true })
  deviceName!: string;

  @Prop({ default: 'android', trim: true })
  platform!: string;

  @Prop({ type: String, default: null, trim: true })
  brand!: string | null;

  @Prop({ type: String, default: null, trim: true })
  model!: string | null;

  @Prop({ type: String, default: null, trim: true })
  androidVersion!: string | null;

  @Prop({ type: String, default: null, trim: true })
  appVersion!: string | null;

  @Prop({ required: true })
  fcmToken!: string;

  @Prop({ type: String, default: null, trim: true })
  simLabel!: string | null;

  @Prop({ type: Number, default: null })
  simSlot!: number | null;

  @Prop({ type: String, default: null, trim: true })
  phoneNumber!: string | null;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({
    type: String,
    enum: DeviceStatus,
    default: DeviceStatus.ONLINE,
    index: true,
  })
  status!: DeviceStatus;

  @Prop({ type: Number, default: null })
  batteryLevel!: number | null;

  @Prop({ type: Boolean, default: null })
  isCharging!: boolean | null;

  @Prop({ type: Date, default: Date.now, index: true })
  lastSeenAt!: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Compound index for fast user+status queries used by the eligible device helper
DeviceSchema.index({ userId: 1, status: 1, isActive: 1, lastSeenAt: -1 });
