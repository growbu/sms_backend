import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StripeSDK = require('stripe');
import { UserService } from '../user/user.service.js';
import { SubscriptionStatus } from '../user/schemas/user.schema.js';
import {
  PLANS,
  getPlanByPriceId,
  getStripePriceId,
  type PlanKey,
  type BillingInterval,
  type PlanDefinition,
} from './billing.config.js';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: InstanceType<typeof StripeSDK>;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new StripeSDK(secretKey);
  }

  // ─── Checkout Session ─────────────────────────────────────────────

  async createCheckoutSession(
    userId: string,
    email: string,
    fullName: string,
    planKey: PlanKey,
    interval: BillingInterval,
    origin: string,
  ): Promise<{ url: string }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find or create Stripe Customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email,
        name: fullName,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      await this.userService.updateSubscriptionStatus(
        userId,
        user.subscriptionStatus,
        { stripeCustomerId },
      );
    }

    // Resolve the price ID
    const priceId = getStripePriceId(planKey, interval);
    if (!priceId) {
      throw new BadRequestException(
        `No Stripe price configured for plan "${planKey}" with interval "${interval}"`,
      );
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
      metadata: { userId, planKey, interval },
      subscription_data: {
        metadata: { userId, planKey, interval },
      },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    this.logger.log(
      `Created checkout session for user ${userId}, plan=${planKey}, interval=${interval}`,
    );

    return { url: session.url };
  }

  // ─── Customer Portal ──────────────────────────────────────────────

  async createPortalSession(
    userId: string,
    origin: string,
  ): Promise<{ url: string }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.stripeCustomerId) {
      throw new BadRequestException(
        'No Stripe customer found. Please subscribe to a plan first.',
      );
    }

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/billing`,
    });

    this.logger.log(`Created portal session for user ${userId}`);

    return { url: portalSession.url };
  }

  // ─── Billing Status ───────────────────────────────────────────────

  async getBillingStatus(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasSubscription =
      user.subscriptionStatus === SubscriptionStatus.ACTIVE ||
      user.subscriptionStatus === SubscriptionStatus.PAST_DUE;

    const plan: PlanKey | null = (user.currentPlan as PlanKey) ?? null;
    let planDef: PlanDefinition | undefined;
    if (plan) {
      planDef = PLANS[plan];
    }

    // Determine billing interval from the price ID
    let billingInterval: BillingInterval | null = null;
    if (user.stripePriceId && planDef) {
      billingInterval =
        user.stripePriceId === planDef.stripePriceIdYearly
          ? 'yearly'
          : 'monthly';
    }

    // Map internal status to dashboard-expected status string
    let subscriptionStatus: string | null = null;
    if (user.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      subscriptionStatus = 'active';
    } else if (user.subscriptionStatus === SubscriptionStatus.PAST_DUE) {
      subscriptionStatus = 'past_due';
    } else if (user.subscriptionStatus === SubscriptionStatus.CANCELLED) {
      subscriptionStatus = 'canceled';
    } else if (user.subscriptionStatus === SubscriptionStatus.FREE_TRIAL) {
      subscriptionStatus = 'trialing';
    }

    // Build plans array for the dashboard
    const plans = Object.values(PLANS).map((p) => ({
      key: p.key,
      name: p.name,
      monthlyPrice: p.monthlyPrice,
      yearlyPrice: p.yearlyPrice,
      deviceLimit: p.deviceLimit,
      description: p.description,
      features: p.features,
      highlighted: p.highlighted,
    }));

    return {
      hasSubscription,
      plan,
      planName: planDef?.name ?? null,
      price: planDef
        ? billingInterval === 'yearly'
          ? planDef.yearlyPrice
          : planDef.monthlyPrice
        : null,
      billingInterval,
      deviceLimit: user.deviceLimit ?? 0,
      subscriptionStatus,
      currentPeriodEnd: user.subscriptionExpiresAt
        ? user.subscriptionExpiresAt.toISOString()
        : null,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd ?? false,
      plans,
    };
  }

  // ─── Webhook Handler ──────────────────────────────────────────────

  async handleWebhook(rawBody: string | Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  // ─── Webhook Event Handlers ───────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      this.logger.warn('checkout.session.completed without subscription ID');
      return;
    }

    // Retrieve the full subscription to get pricing info
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;

    if (!priceId) {
      this.logger.warn('No price ID found in subscription items');
      return;
    }

    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      this.logger.warn(`No plan found for price ID: ${priceId}`);
      return;
    }

    // Find user by Stripe customer ID
    const user = await this.userService.findByStripeCustomerId(customerId);
    if (!user) {
      this.logger.warn(`No user found for Stripe customer: ${customerId}`);
      return;
    }

    const userId = (user._id as { toString(): string }).toString();

    await this.userService.updateSubscriptionStatus(
      userId,
      SubscriptionStatus.ACTIVE,
      {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        currentPlan: plan.key,
        deviceLimit: plan.deviceLimit,
        subscriptionActivatedAt: new Date(),
        subscriptionExpiresAt: new Date(
          (subscription as unknown as { current_period_end: number }).current_period_end * 1000,
        ),
        cancelAtPeriodEnd: false,
      },
    );

    this.logger.log(
      `Activated subscription for user ${userId}: plan=${plan.key}, sub=${subscriptionId}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const customerId = subscription.customer as string;
    const user = await this.userService.findByStripeCustomerId(customerId);
    if (!user) {
      this.logger.warn(
        `subscription.updated — no user for customer: ${customerId}`,
      );
      return;
    }

    const userId = (user._id as { toString(): string }).toString();
    const priceId = subscription.items.data[0]?.price?.id;
    const plan = priceId ? getPlanByPriceId(priceId) : undefined;

    // Map Stripe status to internal status
    let status: SubscriptionStatus;
    switch (subscription.status) {
      case 'active':
      case 'trialing':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'past_due':
        status = SubscriptionStatus.PAST_DUE;
        break;
      case 'canceled':
      case 'unpaid':
        status = SubscriptionStatus.CANCELLED;
        break;
      default:
        status = SubscriptionStatus.ACTIVE;
    }

    await this.userService.updateSubscriptionStatus(userId, status, {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId ?? user.stripePriceId,
      currentPlan: plan?.key ?? user.currentPlan,
      deviceLimit: plan?.deviceLimit ?? user.deviceLimit,
      subscriptionExpiresAt: new Date(
        (subscription as unknown as { current_period_end: number }).current_period_end * 1000,
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    this.logger.log(
      `Updated subscription for user ${userId}: status=${subscription.status}, cancel_at_period_end=${subscription.cancel_at_period_end}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const customerId = subscription.customer as string;
    const user = await this.userService.findByStripeCustomerId(customerId);
    if (!user) {
      this.logger.warn(
        `subscription.deleted — no user for customer: ${customerId}`,
      );
      return;
    }

    const userId = (user._id as { toString(): string }).toString();

    await this.userService.updateSubscriptionStatus(
      userId,
      SubscriptionStatus.EXPIRED,
      {
        stripeSubscriptionId: null,
        currentPlan: null,
        deviceLimit: 0,
        cancelAtPeriodEnd: false,
      },
    );

    this.logger.log(`Subscription deleted for user ${userId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    const customerId = invoice.customer as string;
    const user = await this.userService.findByStripeCustomerId(customerId);
    if (!user) {
      this.logger.warn(
        `invoice.payment_failed — no user for customer: ${customerId}`,
      );
      return;
    }

    const userId = (user._id as { toString(): string }).toString();
    await this.userService.updateSubscriptionStatus(
      userId,
      SubscriptionStatus.PAST_DUE,
    );

    this.logger.log(`Payment failed for user ${userId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleInvoicePaid(invoice: any): Promise<void> {
    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) {
      return;
    }

    const user = await this.userService.findByStripeCustomerId(customerId);
    if (!user) {
      this.logger.warn(
        `invoice.paid — no user for customer: ${customerId}`,
      );
      return;
    }

    const userId = (user._id as { toString(): string }).toString();

    // Re-fetch subscription from Stripe for fresh data
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;
    const plan = priceId ? getPlanByPriceId(priceId) : undefined;

    await this.userService.updateSubscriptionStatus(
      userId,
      SubscriptionStatus.ACTIVE,
      {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId ?? user.stripePriceId,
        currentPlan: plan?.key ?? user.currentPlan,
        deviceLimit: plan?.deviceLimit ?? user.deviceLimit,
        subscriptionExpiresAt: new Date(
          (subscription as unknown as { current_period_end: number }).current_period_end * 1000,
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    );

    this.logger.log(
      `Invoice paid for user ${userId}, subscription refreshed`,
    );
  }
}
