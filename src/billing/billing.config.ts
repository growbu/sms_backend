export type PlanKey = 'starter' | 'team' | 'business';
export type BillingInterval = 'monthly' | 'yearly';

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  deviceLimit: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  description: string;
  features: string[];
  highlighted: boolean;
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  starter: {
    key: 'starter',
    name: 'Starter',
    monthlyPrice: 12,
    yearlyPrice: 115,
    deviceLimit: 1,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER || '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
    description: 'Perfect for individuals getting started',
    features: [
      '1 connected device',
      'Unlimited SMS sending',
      'Basic analytics',
      'Email support',
    ],
    highlighted: false,
  },
  team: {
    key: 'team',
    name: 'Team',
    monthlyPrice: 25,
    yearlyPrice: 240,
    deviceLimit: 5,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_TEAM || '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_TEAM_YEARLY || '',
    description: 'Great for small teams and growing businesses',
    features: [
      'Up to 5 connected devices',
      'Unlimited SMS sending',
      'Advanced analytics',
      'Priority email support',
      'Campaign management',
    ],
    highlighted: true,
  },
  business: {
    key: 'business',
    name: 'Business',
    monthlyPrice: 50,
    yearlyPrice: 480,
    deviceLimit: 10,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BUSINESS || '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || '',
    description: 'For larger organizations with advanced needs',
    features: [
      'Up to 10 connected devices',
      'Unlimited SMS sending',
      'Full analytics suite',
      'Dedicated support',
      'Campaign management',
      'API access',
    ],
    highlighted: false,
  },
};

export function getPlanByPriceId(priceId: string): PlanDefinition | undefined {
  return Object.values(PLANS).find(
    (p) =>
      p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId,
  );
}

export function getStripePriceId(
  planKey: PlanKey,
  interval: BillingInterval,
): string {
  const plan = PLANS[planKey];
  return interval === 'yearly'
    ? plan.stripePriceIdYearly
    : plan.stripePriceIdMonthly;
}
