import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty({ message: 'deviceId is required' })
  deviceId!: string;

  @IsString()
  @IsNotEmpty({ message: 'deviceName is required' })
  deviceName!: string;

  @IsString()
  @IsNotEmpty({ message: 'fcmToken is required' })
  fcmToken!: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  androidVersion?: string;

  @IsString()
  @IsOptional()
  appVersion?: string;

  @IsString()
  @IsOptional()
  simLabel?: string;

  @IsNumber()
  @IsOptional()
  simSlot?: number;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
