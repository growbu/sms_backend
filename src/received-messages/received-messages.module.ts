import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReceivedMessage,
  ReceivedMessageSchema,
} from './schemas/received-message.schema.js';
import { ReceivedMessagesController } from './received-messages.controller.js';
import { ReceivedMessagesService } from './received-messages.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReceivedMessage.name, schema: ReceivedMessageSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReceivedMessagesController],
  providers: [ReceivedMessagesService],
  exports: [ReceivedMessagesService],
})
export class ReceivedMessagesModule {}
