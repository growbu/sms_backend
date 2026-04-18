import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class QueryReceivedMessagesDto {
  @IsString()
  @IsOptional()
  sender?: string;

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
