"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const message_schema_js_1 = require("./schemas/message.schema.js");
const messages_controller_js_1 = require("./messages.controller.js");
const messages_service_js_1 = require("./messages.service.js");
const fcm_service_js_1 = require("./services/fcm.service.js");
const devices_module_js_1 = require("../devices/devices.module.js");
const api_keys_module_js_1 = require("../api-keys/api-keys.module.js");
const subscription_module_js_1 = require("../subscription/subscription.module.js");
let MessagesModule = class MessagesModule {
};
exports.MessagesModule = MessagesModule;
exports.MessagesModule = MessagesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: message_schema_js_1.Message.name, schema: message_schema_js_1.MessageSchema }]),
            devices_module_js_1.DevicesModule,
            api_keys_module_js_1.ApiKeysModule,
            subscription_module_js_1.SubscriptionModule,
        ],
        controllers: [messages_controller_js_1.MessagesController],
        providers: [messages_service_js_1.MessagesService, fcm_service_js_1.FcmService],
        exports: [messages_service_js_1.MessagesService, fcm_service_js_1.FcmService],
    })
], MessagesModule);
//# sourceMappingURL=messages.module.js.map