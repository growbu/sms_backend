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
}
