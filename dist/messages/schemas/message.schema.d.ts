import { HydratedDocument, Types } from 'mongoose';
export type MessageDocument = HydratedDocument<Message>;
export declare enum MessageStatus {
    QUEUED = "queued",
    DISPATCHING = "dispatching",
    SENDING = "sending",
    SENT = "sent",
    DELIVERED = "delivered",
    FAILED = "failed"
}
export declare const VALID_STATUS_TRANSITIONS: Record<MessageStatus, MessageStatus[]>;
export declare enum MessageSource {
    API = "api",
    DASHBOARD = "dashboard",
    MANUAL = "manual",
    SYSTEM = "system",
    CAMPAIGN = "campaign"
}
export declare class Message {
    userId: Types.ObjectId;
    apiKeyId: Types.ObjectId | null;
    campaignId: Types.ObjectId | null;
    deviceId: Types.ObjectId | null;
    recipient: string;
    message: string;
    segmentsCount: number | null;
    status: MessageStatus;
    failureReason: string | null;
    provider: string;
    source: MessageSource;
    externalRequestId: string | null;
    queuedAt: Date | null;
    dispatchedAt: Date | null;
    sendingAt: Date | null;
    sentAt: Date | null;
    deliveredAt: Date | null;
    failedAt: Date | null;
}
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, any, any, Message>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, import("mongoose").Document<unknown, {}, Message, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    apiKeyId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    campaignId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deviceId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    recipient?: import("mongoose").SchemaDefinitionProperty<string, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    message?: import("mongoose").SchemaDefinitionProperty<string, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    segmentsCount?: import("mongoose").SchemaDefinitionProperty<number | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<MessageStatus, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    failureReason?: import("mongoose").SchemaDefinitionProperty<string | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<string, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    source?: import("mongoose").SchemaDefinitionProperty<MessageSource, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    externalRequestId?: import("mongoose").SchemaDefinitionProperty<string | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    queuedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    dispatchedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sendingAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deliveredAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    failedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Message>;
