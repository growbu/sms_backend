import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'fcmToken is required' })
  fcmToken!: string;
}
