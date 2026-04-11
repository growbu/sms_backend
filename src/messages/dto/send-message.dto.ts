import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Recipient phone number is required' })
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message:
      'Recipient must be a valid phone number (E.164 or national format, 7-15 digits)',
  })
  recipient!: string;

  @IsString()
  @IsNotEmpty({ message: 'Message text is required' })
  @MinLength(1)
  @MaxLength(1600, { message: 'Message must not exceed 1600 characters' })
  message!: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  externalRequestId?: string;
}
