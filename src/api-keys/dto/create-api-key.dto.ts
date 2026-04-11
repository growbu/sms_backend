import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { API_KEY_SCOPES } from '../schemas/api-key.schema.js';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty({ message: 'API key name is required' })
  name!: string;

  @IsArray()
  @ArrayUnique()
  @IsIn(API_KEY_SCOPES as unknown as string[], { each: true })
  @IsOptional()
  scopes?: string[];

  @IsDateString({}, { message: 'expiresAt must be a valid ISO date string' })
  @IsOptional()
  expiresAt?: string;

  @IsNumber()
  @Min(1, { message: 'Rate limit must be at least 1 request per minute' })
  @IsOptional()
  rateLimitPerMinute?: number;
}
