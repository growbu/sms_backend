import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum HeartbeatStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export class HeartbeatDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  batteryLevel?: number;

  @IsBoolean()
  @IsOptional()
  isCharging?: boolean;

  @IsEnum(HeartbeatStatus, {
    message: 'status must be either "online" or "offline"',
  })
  @IsOptional()
  status?: HeartbeatStatus;

  @IsString()
  @IsOptional()
  simLabel?: string;

  @IsNumber()
  @IsOptional()
  simSlot?: number;
}
