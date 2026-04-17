import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionStatus {
  FREE_TRIAL = 'free_trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ type: String, default: null })
  passwordHash!: string | null;

  @Prop({ type: String, enum: AuthProvider, default: AuthProvider.LOCAL })
  provider!: AuthProvider;

  @Prop({ type: String, default: null })
  googleId!: string | null;

  @Prop({ type: String, default: null })
  avatar!: string | null;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ type: String, default: null })
  refreshTokenHash!: string | null;

  // ─── Subscription & Trial ──────────────────────────────────────────

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.FREE_TRIAL,
  })
  subscriptionStatus!: SubscriptionStatus;

  @Prop({ type: Date, default: () => new Date() })
  trialStartedAt!: Date;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })
  trialEndsAt!: Date;

  @Prop({ type: Number, default: 0 })
  trialSmsUsed!: number;

  @Prop({ type: Number, default: 50 })
  trialSmsLimit!: number;

  @Prop({ type: String, default: null })
  stripeCustomerId!: string | null;

  @Prop({ type: String, default: null })
  stripeSubscriptionId!: string | null;

  @Prop({ type: Date, default: null })
  subscriptionActivatedAt!: Date | null;

  @Prop({ type: Date, default: null })
  subscriptionExpiresAt!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
