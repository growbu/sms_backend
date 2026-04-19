import { Model } from 'mongoose';
import { User, UserDocument, SubscriptionStatus } from './schemas/user.schema.js';
export declare class UserService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    findById(id: string): Promise<UserDocument | null>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findByGoogleId(googleId: string): Promise<UserDocument | null>;
    create(data: Partial<User>): Promise<UserDocument>;
    updateRefreshTokenHash(userId: string, hash: string | null): Promise<void>;
    updateProfile(userId: string, updates: Partial<Pick<User, 'fullName' | 'avatar'>>): Promise<UserDocument | null>;
    linkGoogleAccount(userId: string, googleId: string, avatar: string | null): Promise<UserDocument | null>;
    incrementTrialSmsUsed(userId: string): Promise<UserDocument | null>;
    updateSubscriptionStatus(userId: string, status: SubscriptionStatus, fields?: Partial<Pick<User, 'stripeCustomerId' | 'stripeSubscriptionId' | 'subscriptionActivatedAt' | 'subscriptionExpiresAt' | 'stripePriceId' | 'currentPlan' | 'deviceLimit' | 'cancelAtPeriodEnd'>>): Promise<UserDocument | null>;
    findByStripeCustomerId(stripeCustomerId: string): Promise<UserDocument | null>;
}
