import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReceivedMessageDocument = HydratedDocument<ReceivedMessage>;

@Schema({ timestamps: true })
export class ReceivedMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Device', default: null, index: true })
  deviceId!: Types.ObjectId | null;

  @Prop({ required: true, trim: true, index: true })
  sender!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: Date, required: true })
  receivedAt!: Date;
}

export const ReceivedMessageSchema =
  SchemaFactory.createForClass(ReceivedMessage);

// Compound indexes for common query patterns
ReceivedMessageSchema.index({ userId: 1, receivedAt: -1 });
ReceivedMessageSchema.index({ userId: 1, sender: 1, receivedAt: -1 });
