import { HydratedDocument, Types } from 'mongoose';
export type ApiKeyDocument = HydratedDocument<ApiKey>;
export declare const API_KEY_SCOPES: readonly ["messages:send", "messages:read", "devices:read"];
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];
export declare class ApiKey {
    userId: Types.ObjectId;
    name: string;
    prefix: string;
    keyHash: string;
    scopes: string[];
    isActive: boolean;
    lastUsedAt: Date | null;
    lastUsedIp: string | null;
    requestCount: number;
    rateLimitPerMinute: number | null;
    expiresAt: Date | null;
    revokedAt: Date | null;
}
export declare const ApiKeySchema: import("mongoose").Schema<ApiKey, import("mongoose").Model<ApiKey, any, any, any, any, any, ApiKey>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    prefix?: import("mongoose").SchemaDefinitionProperty<string, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    keyHash?: import("mongoose").SchemaDefinitionProperty<string, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scopes?: import("mongoose").SchemaDefinitionProperty<string[], ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastUsedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastUsedIp?: import("mongoose").SchemaDefinitionProperty<string | null, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requestCount?: import("mongoose").SchemaDefinitionProperty<number, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rateLimitPerMinute?: import("mongoose").SchemaDefinitionProperty<number | null, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date | null, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    revokedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, ApiKey, import("mongoose").Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ApiKey>;
