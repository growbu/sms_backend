import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
import { CampaignStatus } from '../schemas/campaign.schema.js';

export class QueryCampaignsDto {
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @IsString()
  @IsOptional()
  search?: string;

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
