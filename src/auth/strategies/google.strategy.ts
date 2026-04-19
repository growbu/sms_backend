import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback, type Profile } from 'passport-google-oauth20';

export interface GoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  picture: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientID = configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.getOrThrow<string>('GOOGLE_OAUTH_CALLBACK_URL');

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, displayName, emails, photos } = profile;

    const email = emails?.[0]?.value ?? null;
    const picture = photos?.[0]?.value ?? null;

    const googleUser: GoogleUser = {
      googleId: id,
      email: email ?? '',
      fullName: displayName ?? email ?? 'User',
      picture,
    };

    done(null, googleUser);
  }
}
