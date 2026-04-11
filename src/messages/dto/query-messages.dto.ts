import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
import { MessageStatus, MessageSource } from '../schemas/message.schema.js';

export class QueryMessagesDto {
  @IsEnum(MessageStatus)
  @IsOptional()
  status?: MessageStatus;

  @IsString()
  @IsOptional()
  recipient?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsEnum(MessageSource)
  @IsOptional()
  source?: MessageSource;

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}
