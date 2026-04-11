"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const api_key_schema_js_1 = require("./schemas/api-key.schema.js");
const api_keys_controller_js_1 = require("./api-keys.controller.js");
const api_keys_service_js_1 = require("./api-keys.service.js");
const api_key_guard_js_1 = require("./guards/api-key.guard.js");
const key_rate_limiter_service_js_1 = require("./services/key-rate-limiter.service.js");
let ApiKeysModule = class ApiKeysModule {
};
exports.ApiKeysModule = ApiKeysModule;
exports.ApiKeysModule = ApiKeysModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: api_key_schema_js_1.ApiKey.name, schema: api_key_schema_js_1.ApiKeySchema }]),
        ],
        controllers: [api_keys_controller_js_1.ApiKeysController],
        providers: [api_keys_service_js_1.ApiKeysService, api_key_guard_js_1.ApiKeyGuard, key_rate_limiter_service_js_1.KeyRateLimiterService],
        exports: [api_keys_service_js_1.ApiKeysService, api_key_guard_js_1.ApiKeyGuard, key_rate_limiter_service_js_1.KeyRateLimiterService],
    })
], ApiKeysModule);
//# sourceMappingURL=api-keys.module.js.map