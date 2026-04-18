import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateReceivedMessageDto {
  @IsString()
  @IsNotEmpty()
  sender!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsDateString()
  receivedAt!: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
