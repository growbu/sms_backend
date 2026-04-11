import type { ApiKeyScope } from '../schemas/api-key.schema.js';
export declare const REQUIRED_SCOPES_KEY = "requiredScopes";
export declare const RequiredScopes: (...scopes: ApiKeyScope[]) => import("@nestjs/common").CustomDecorator<string>;
