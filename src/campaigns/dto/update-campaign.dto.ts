import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignRecipientDto } from './create-campaign.dto.js';

export class UpdateCampaignDto {
  @IsString()
  @MinLength(2, { message: 'Campaign name must be at least 2 characters' })
  @MaxLength(200, { message: 'Campaign name must not exceed 200 characters' })
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1600, { message: 'Message content must not exceed 1600 characters' })
  @IsOptional()
  messageContent?: string;

  @IsObject()
  @IsOptional()
  defaultVariables?: Record<string, string>;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one recipient is required' })
  @ValidateNested({ each: true })
  @Type(() => CampaignRecipientDto)
  @IsOptional()
  recipients?: CampaignRecipientDto[];

  @IsDateString({}, { message: 'scheduleAt must be a valid ISO date string' })
  @IsOptional()
  scheduleAt?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
