import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';

export class QueryTemplatesDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsEnum(['true', 'false'])
  @IsOptional()
  isActive?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}
