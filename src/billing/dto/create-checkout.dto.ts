import { IsIn, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsIn(['starter', 'team', 'business'])
  plan!: 'starter' | 'team' | 'business';

  @IsString()
  @IsIn(['monthly', 'yearly'])
  interval!: 'monthly' | 'yearly';
}
