import { HydratedDocument, Types } from 'mongoose';
export type DeviceDocument = HydratedDocument<Device>;
export declare enum DeviceStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    PAUSED = "paused"
}
export declare class Device {
    userId: Types.ObjectId;
    deviceId: string;
    deviceName: string;
    platform: string;
    brand: string | null;
    model: string | null;
    androidVersion: string | null;
    appVersion: string | null;
    fcmToken: string;
    simLabel: string | null;
    simSlot: number | null;
    phoneNumber: string | null;
    isActive: boolean;
    status: DeviceStatus;
    batteryLevel: number | null;
    isCharging: boolean | null;
    lastSeenAt: Date;
}
export declare const DeviceSchema: import("mongoose").Schema<Device, import("mongoose").Model<Device, any, any, any, any, any, Device>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Device, import("mongoose").Document<unknown, {}, Device, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deviceId?: import("mongoose").SchemaDefinitionProperty<string, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deviceName?: import("mongoose").SchemaDefinitionProperty<string, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    platform?: import("mongoose").SchemaDefinitionProperty<string, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    brand?: import("mongoose").SchemaDefinitionProperty<string | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    model?: import("mongoose").SchemaDefinitionProperty<string | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    androidVersion?: import("mongoose").SchemaDefinitionProperty<string | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    appVersion?: import("mongoose").SchemaDefinitionProperty<string | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fcmToken?: import("mongoose").SchemaDefinitionProperty<string, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    simLabel?: import("mongoose").SchemaDefinitionProperty<string | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    simSlot?: import("mongoose").SchemaDefinitionProperty<number | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phoneNumber?: import("mongoose").SchemaDefinitionProperty<string | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<DeviceStatus, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    batteryLevel?: import("mongoose").SchemaDefinitionProperty<number | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isCharging?: import("mongoose").SchemaDefinitionProperty<boolean | null, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastSeenAt?: import("mongoose").SchemaDefinitionProperty<Date, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Device>;
