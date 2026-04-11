import { SetMetadata } from '@nestjs/common';
import type { ApiKeyScope } from '../schemas/api-key.schema.js';

export const REQUIRED_SCOPES_KEY = 'requiredScopes';

/**
 * Decorator to specify which API key scopes are required for an endpoint.
 *
 * Usage:
 * ```
 * @RequiredScopes('messages:send')
 * @UseGuards(ApiKeyGuard)
 * @Post('send')
 * async sendMessage() { ... }
 * ```
 */
export const RequiredScopes = (...scopes: ApiKeyScope[]) =>
  SetMetadata(REQUIRED_SCOPES_KEY, scopes);
