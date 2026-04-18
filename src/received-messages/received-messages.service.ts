import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ReceivedMessage,
  ReceivedMessageDocument,
} from './schemas/received-message.schema.js';
import {
  CreateReceivedMessageDto,
  QueryReceivedMessagesDto,
} from './dto/index.js';

@Injectable()
export class ReceivedMessagesService {
  private readonly logger = new Logger(ReceivedMessagesService.name);

  constructor(
    @InjectModel(ReceivedMessage.name)
    private readonly receivedMessageModel: Model<ReceivedMessageDocument>,
  ) {}

  // ─── Create (device callback) ──────────────────────────────────────────

  async create(
    userId: string,
    dto: CreateReceivedMessageDto,
  ): Promise<ReceivedMessageDocument> {
    const doc = await this.receivedMessageModel.create({
      userId: new Types.ObjectId(userId),
      deviceId: dto.deviceId ? new Types.ObjectId(dto.deviceId) : null,
      sender: dto.sender.trim(),
      message: dto.message,
      receivedAt: new Date(dto.receivedAt),
    });

    this.logger.log(
      `Received SMS stored: ${(doc._id as { toString(): string }).toString()} from ${dto.sender}`,
    );

    return doc;
  }

  // ─── List (paginated) ──────────────────────────────────────────────────

  async list(
    userId: string,
    query: QueryReceivedMessagesDto,
  ): Promise<{
    messages: ReceivedMessageDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (query.sender) {
      filter.sender = { $regex: query.sender.trim(), $options: 'i' };
    }

    if (query.from || query.to) {
      const receivedAtFilter: Record<string, Date> = {};
      if (query.from) {
        receivedAtFilter.$gte = new Date(query.from);
      }
      if (query.to) {
        receivedAtFilter.$lte = new Date(query.to);
      }
      filter.receivedAt = receivedAtFilter;
    }

    const [messages, total] = await Promise.all([
      this.receivedMessageModel
        .find(filter)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.receivedMessageModel.countDocuments(filter).exec(),
    ]);

    return {
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Get One ───────────────────────────────────────────────────────────

  async getOne(
    userId: string,
    messageId: string,
  ): Promise<ReceivedMessageDocument> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Received message not found');
    }

    const doc = await this.receivedMessageModel.findById(messageId).exec();

    if (!doc) {
      throw new NotFoundException('Received message not found');
    }

    if (doc.userId.toString() !== userId) {
      throw new NotFoundException('Received message not found');
    }

    return doc;
  }

  // ─── Serializer ────────────────────────────────────────────────────────

  serialize(doc: ReceivedMessageDocument) {
    const obj = doc.toObject() as unknown as Record<string, unknown>;
    return {
      id: (doc._id as { toString(): string }).toString(),
      sender: obj.sender,
      message: obj.message,
      deviceId: obj.deviceId
        ? (obj.deviceId as { toString(): string }).toString()
        : null,
      receivedAt: obj.receivedAt,
      createdAt: obj.createdAt,
    };
  }
}
