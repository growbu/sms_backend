import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module.js';
import { SubscriptionService } from './subscription.service.js';

@Module({
  imports: [UserModule],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
