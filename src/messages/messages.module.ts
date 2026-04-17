import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';
import { FcmService } from './services/fcm.service.js';
import { DevicesModule } from '../devices/devices.module.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    DevicesModule,
    ApiKeysModule,
    SubscriptionModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, FcmService],
  exports: [MessagesService, FcmService],
})
export class MessagesModule {}
