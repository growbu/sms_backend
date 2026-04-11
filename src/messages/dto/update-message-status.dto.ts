import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CallbackStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export class UpdateMessageStatusDto {
  @IsEnum(CallbackStatus, {
    message: 'status must be one of: sending, sent, delivered, failed',
  })
  status!: CallbackStatus;

  @IsString()
  @IsOptional()
  failureReason?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  errorCode?: string;
}
