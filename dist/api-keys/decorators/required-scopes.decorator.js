"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredScopes = exports.REQUIRED_SCOPES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRED_SCOPES_KEY = 'requiredScopes';
const RequiredScopes = (...scopes) => (0, common_1.SetMetadata)(exports.REQUIRED_SCOPES_KEY, scopes);
exports.RequiredScopes = RequiredScopes;
//# sourceMappingURL=required-scopes.decorator.js.map