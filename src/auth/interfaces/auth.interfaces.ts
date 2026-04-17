export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface SubscriptionInfo {
  status: string;
  trialDaysRemaining: number;
  trialSmsRemaining: number;
  trialSmsUsed: number;
  trialSmsLimit: number;
  trialEndsAt: Date | null;
  subscriptionExpiresAt: Date | null;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  provider: string;
  avatar: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  subscription: SubscriptionInfo;
}
