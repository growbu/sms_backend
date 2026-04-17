import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
  SubscriptionStatus,
} from './schemas/user.schema.js';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .exec();
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async updateRefreshTokenHash(
    userId: string,
    hash: string | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: hash })
      .exec();
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<User, 'fullName' | 'avatar'>>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { $set: updates }, { new: true })
      .exec();
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
    avatar: string | null,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          googleId,
          avatar,
          isEmailVerified: true,
        },
        { new: true },
      )
      .exec();
  }

  // ─── Subscription & Trial ──────────────────────────────────────────

  async incrementTrialSmsUsed(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $inc: { trialSmsUsed: 1 } },
        { new: true },
      )
      .exec();
  }

  async updateSubscriptionStatus(
    userId: string,
    status: SubscriptionStatus,
    fields?: Partial<
      Pick<
        User,
        | 'stripeCustomerId'
        | 'stripeSubscriptionId'
        | 'subscriptionActivatedAt'
        | 'subscriptionExpiresAt'
      >
    >,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { subscriptionStatus: status, ...fields } },
        { new: true },
      )
      .exec();
  }
}
