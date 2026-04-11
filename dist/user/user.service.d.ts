import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
export declare class UserService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    findById(id: string): Promise<UserDocument | null>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findByGoogleId(googleId: string): Promise<UserDocument | null>;
    create(data: Partial<User>): Promise<UserDocument>;
    updateRefreshTokenHash(userId: string, hash: string | null): Promise<void>;
    updateProfile(userId: string, updates: Partial<Pick<User, 'fullName' | 'avatar'>>): Promise<UserDocument | null>;
    linkGoogleAccount(userId: string, googleId: string, avatar: string | null): Promise<UserDocument | null>;
}
