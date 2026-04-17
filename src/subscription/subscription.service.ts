import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import {
  SubscriptionStatus,
  type UserDocument,
} from '../user/schemas/user.schema.js';

/**
 * Computed subscription state exposed to the dashboard.
 */
export interface SubscriptionStatusResponse {
  status:
    | 'free_trial_active'
    | 'free_trial_expired'
    | 'limit_reached'
    | 'paid_active'
    | 'paid_inactive';
  trialDaysRemaining: number;
  trialSmsRemaining: number;
  trialSmsUsed: number;
  trialSmsLimit: number;
  trialEndsAt: Date | null;
  subscriptionExpiresAt: Date | null;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly userService: UserService) {}

  // ─── Gate: Can this user send an SMS right now? ─────────────────────

  async assertCanSendSms(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const status = this.computeStatus(user);

    switch (status) {
      case 'paid_active':
        return; // Always allowed
      case 'free_trial_active':
        return; // Allowed (under limits)
      case 'free_trial_expired':
        throw new ForbiddenException(
          'Your free trial has expired. Please subscribe to a paid plan to continue sending SMS.',
        );
      case 'limit_reached':
        throw new ForbiddenException(
          'You have reached the free trial SMS limit (50 SMS). Please subscribe to a paid plan to continue sending SMS.',
        );
      case 'paid_inactive':
        throw new ForbiddenException(
          'Your subscription is inactive. Please renew your subscription to continue sending SMS.',
        );
    }
  }

  // ─── Record that 1 SMS was sent (for trial users) ──────────────────

  async recordSmsSent(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      return;
    }

    // Only count against trial quota for trial users
    const subStatus = user.subscriptionStatus ?? SubscriptionStatus.FREE_TRIAL;
    if (subStatus === SubscriptionStatus.FREE_TRIAL) {
      await this.userService.incrementTrialSmsUsed(userId);
    }
  }

  // ─── Get full subscription status DTO ──────────────────────────────

  async getSubscriptionStatus(
    userId: string,
  ): Promise<SubscriptionStatusResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.buildStatusResponse(user);
  }

  /**
   * Build the subscription status response from a user document.
   * Can be used directly when we already have the user loaded.
   */
  buildStatusResponse(user: UserDocument): SubscriptionStatusResponse {
    const status = this.computeStatus(user);
    const now = new Date();

    const trialEndsAt = this.getTrialEndsAt(user);
    const trialSmsUsed = user.trialSmsUsed ?? 0;
    const trialSmsLimit = user.trialSmsLimit ?? 50;

    let trialDaysRemaining = 0;
    if (trialEndsAt && trialEndsAt > now) {
      trialDaysRemaining = Math.ceil(
        (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    const trialSmsRemaining = Math.max(0, trialSmsLimit - trialSmsUsed);

    return {
      status,
      trialDaysRemaining,
      trialSmsRemaining,
      trialSmsUsed,
      trialSmsLimit,
      trialEndsAt,
      subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
    };
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  private computeStatus(
    user: UserDocument,
  ):
    | 'free_trial_active'
    | 'free_trial_expired'
    | 'limit_reached'
    | 'paid_active'
    | 'paid_inactive' {
    const subStatus = user.subscriptionStatus ?? SubscriptionStatus.FREE_TRIAL;
    const now = new Date();

    // Paid subscription states
    if (subStatus === SubscriptionStatus.ACTIVE) {
      const expiresAt = user.subscriptionExpiresAt;
      if (!expiresAt || expiresAt > now) {
        return 'paid_active';
      }
      return 'paid_inactive';
    }

    // Past due — still allow (grace period logic can be added later)
    if (subStatus === SubscriptionStatus.PAST_DUE) {
      return 'paid_inactive';
    }

    if (
      subStatus === SubscriptionStatus.CANCELLED ||
      subStatus === SubscriptionStatus.EXPIRED
    ) {
      return 'paid_inactive';
    }

    // Free trial
    if (subStatus === SubscriptionStatus.FREE_TRIAL) {
      const trialEndsAt = this.getTrialEndsAt(user);
      const trialSmsUsed = user.trialSmsUsed ?? 0;
      const trialSmsLimit = user.trialSmsLimit ?? 50;

      // Check SMS limit first (takes priority in messaging)
      if (trialSmsUsed >= trialSmsLimit) {
        return 'limit_reached';
      }

      // Check time expiry
      if (trialEndsAt && trialEndsAt <= now) {
        return 'free_trial_expired';
      }

      return 'free_trial_active';
    }

    return 'paid_inactive';
  }

  /**
   * Get trial end date, falling back to createdAt + 7 days for
   * existing users who were created before the trial fields existed.
   */
  private getTrialEndsAt(user: UserDocument): Date | null {
    if (user.trialEndsAt) {
      return user.trialEndsAt;
    }

    // Fallback for legacy users: createdAt + 7 days
    const doc = user.toObject() as unknown as Record<string, unknown>;
    const createdAt = doc.createdAt as Date | undefined;
    if (createdAt) {
      return new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return null;
  }
}
