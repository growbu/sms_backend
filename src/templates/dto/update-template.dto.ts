import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  @MinLength(2, { message: 'Template name must be at least 2 characters' })
  @MaxLength(100, { message: 'Template name must not exceed 100 characters' })
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1600, { message: 'Template content must not exceed 1600 characters' })
  @Matches(/^(?!.*\{\{[^}]*\{\{)(?!.*\}\}[^{]*\}\}).*$/s, {
    message: 'Template content contains malformed placeholder syntax. Use {{variableName}} format.',
  })
  @IsOptional()
  content?: string;

  @IsString()
  @MaxLength(50, { message: 'Category must not exceed 50 characters' })
  @IsOptional()
  category?: string;

  @IsString()
  @MaxLength(10, { message: 'Language code must not exceed 10 characters' })
  @IsOptional()
  language?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
