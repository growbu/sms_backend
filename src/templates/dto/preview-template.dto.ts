import { IsObject, IsOptional } from 'class-validator';

export class PreviewTemplateDto {
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;
}
