import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateDeviceStatusDto {
  @IsBoolean()
  @IsNotEmpty({ message: 'isActive is required' })
  isActive!: boolean;
}
