import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyApiKeyDto {
  @IsString()
  @IsNotEmpty({ message: 'apiKey is required' })
  apiKey!: string;
}
