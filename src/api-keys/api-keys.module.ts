import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKey, ApiKeySchema } from './schemas/api-key.schema.js';
import { ApiKeysController } from './api-keys.controller.js';
import { ApiKeysService } from './api-keys.service.js';
import { ApiKeyGuard } from './guards/api-key.guard.js';
import { KeyRateLimiterService } from './services/key-rate-limiter.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }]),
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard, KeyRateLimiterService],
  exports: [ApiKeysService, ApiKeyGuard, KeyRateLimiterService],
})
export class ApiKeysModule {}
