import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Campaign,
  CampaignDocument,
  CampaignStatus,
  RecipientStatus,
  VALID_CAMPAIGN_TRANSITIONS,
} from './schemas/campaign.schema.js';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  QueryCampaignsDto,
  CampaignRecipientDto,
} from './dto/index.js';
import { TemplatesService } from '../templates/templates.service.js';
import { MessagesService } from '../messages/messages.service.js';
import { MessageSource } from '../messages/schemas/message.schema.js';

/**
 * Maximum recipients to process per single invocation.
 * Keeps serverless execution within timeout limits.
 */
const BATCH_SIZE = 50;

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
    private readonly templatesService: TemplatesService,
    private readonly messagesService: MessagesService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────

  async createCampaign(
    userId: string,
    dto: CreateCampaignDto,
  ): Promise<CampaignDocument> {
    // Must provide either templateId or messageContent
    if (!dto.templateId && !dto.messageContent) {
      throw new BadRequestException(
        'Either templateId or messageContent is required',
      );
    }

    // Validate template if provided
    let messageContentSnapshot: string | null = null;
    if (dto.templateId) {
      const template = await this.templatesService.checkTemplateExists(
        userId,
        dto.templateId,
      );
      messageContentSnapshot = template.content;
    } else {
      messageContentSnapshot = dto.messageContent!;
    }

    // Process recipients
    const { valid, invalid, duplicates } = this.processRecipients(
      dto.recipients,
    );

    // Validate scheduleAt is not in the past
    if (dto.scheduleAt) {
      const scheduleDate = new Date(dto.scheduleAt);
      if (scheduleDate <= new Date()) {
        throw new BadRequestException(
          'scheduleAt must be a future date. For immediate execution, omit scheduleAt and call the launch endpoint.',
        );
      }
    }

    const campaign = await this.campaignModel.create({
      userId: new Types.ObjectId(userId),
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
      status: CampaignStatus.DRAFT,
      templateId: dto.templateId
        ? new Types.ObjectId(dto.templateId)
        : null,
      messageContentSnapshot,
      defaultVariables: dto.defaultVariables ?? null,
      recipients: valid.map((r) => ({
        phoneNumber: r.phoneNumber,
        variables: r.variables ?? null,
        status: RecipientStatus.PENDING,
        messageId: null,
        processedAt: null,
      })),
      totalRecipients: dto.recipients.length,
      validRecipients: valid.length,
      invalidRecipients: invalid.length,
      duplicateRecipients: duplicates,
      sentCount: 0,
      failedCount: 0,
      deliveredCount: 0,
      pendingCount: valid.length,
      deviceId: dto.deviceId ? new Types.ObjectId(dto.deviceId) : null,
      scheduleAt: dto.scheduleAt ? new Date(dto.scheduleAt) : null,
      processedIndex: 0,
    });

    return campaign;
  }

  // ─── Update (draft/scheduled only) ──────────────────────────────────

  async updateCampaign(
    userId: string,
    campaignId: string,
    dto: UpdateCampaignDto,
  ): Promise<CampaignDocument> {
    const campaign = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        `Cannot update a campaign in "${campaign.status}" status. Only draft or scheduled campaigns can be edited.`,
      );
    }

    const updateFields: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      updateFields.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      updateFields.description = dto.description.trim() || null;
    }
    if (dto.templateId !== undefined) {
      const template = await this.templatesService.checkTemplateExists(
        userId,
        dto.templateId,
      );
      updateFields.templateId = new Types.ObjectId(dto.templateId);
      updateFields.messageContentSnapshot = template.content;
    }
    if (dto.messageContent !== undefined) {
      updateFields.messageContentSnapshot = dto.messageContent;
      if (!dto.templateId) {
        updateFields.templateId = null;
      }
    }
    if (dto.defaultVariables !== undefined) {
      updateFields.defaultVariables = dto.defaultVariables;
    }
    if (dto.recipients !== undefined) {
      const { valid, invalid, duplicates } = this.processRecipients(
        dto.recipients,
      );
      updateFields.recipients = valid.map((r) => ({
        phoneNumber: r.phoneNumber,
        variables: r.variables ?? null,
        status: RecipientStatus.PENDING,
        messageId: null,
        processedAt: null,
      }));
      updateFields.totalRecipients = dto.recipients.length;
      updateFields.validRecipients = valid.length;
      updateFields.invalidRecipients = invalid.length;
      updateFields.duplicateRecipients = duplicates;
      updateFields.pendingCount = valid.length;
      updateFields.sentCount = 0;
      updateFields.failedCount = 0;
      updateFields.deliveredCount = 0;
      updateFields.processedIndex = 0;
    }
    if (dto.scheduleAt !== undefined) {
      const scheduleDate = new Date(dto.scheduleAt);
      if (scheduleDate <= new Date()) {
        throw new BadRequestException('scheduleAt must be a future date');
      }
      updateFields.scheduleAt = scheduleDate;
    }
    if (dto.deviceId !== undefined) {
      updateFields.deviceId = dto.deviceId
        ? new Types.ObjectId(dto.deviceId)
        : null;
    }

    if (Object.keys(updateFields).length === 0) {
      return campaign;
    }

    const updated = await this.campaignModel
      .findByIdAndUpdate(campaignId, { $set: updateFields }, { new: true })
      .exec();

    return updated!;
  }

  // ─── Delete ──────────────────────────────────────────────────────────

  async deleteCampaign(
    userId: string,
    campaignId: string,
  ): Promise<void> {
    const campaign = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    const deletableStatuses: CampaignStatus[] = [
      CampaignStatus.DRAFT,
      CampaignStatus.COMPLETED,
      CampaignStatus.CANCELLED,
      CampaignStatus.FAILED,
    ];

    if (!deletableStatuses.includes(campaign.status)) {
      throw new BadRequestException(
        `Cannot delete a campaign in "${campaign.status}" status. Cancel it first.`,
      );
    }

    await campaign.deleteOne();
  }

  // ─── Get Single ──────────────────────────────────────────────────────

  async getCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignDocument> {
    return this.findCampaignAndVerifyOwnership(userId, campaignId);
  }

  // ─── List with Pagination ────────────────────────────────────────────

  async listCampaigns(
    userId: string,
    query: QueryCampaignsDto,
  ): Promise<{
    campaigns: CampaignDocument[];
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

    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }
    if (query.from || query.to) {
      const createdAtFilter: Record<string, Date> = {};
      if (query.from) {
        createdAtFilter.$gte = new Date(query.from);
      }
      if (query.to) {
        createdAtFilter.$lte = new Date(query.to);
      }
      filter.createdAt = createdAtFilter;
    }

    const [campaigns, total] = await Promise.all([
      this.campaignModel
        .find(filter)
        .select('-recipients')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.campaignModel.countDocuments(filter).exec(),
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Launch ──────────────────────────────────────────────────────────

  async launchCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignDocument> {
    const campaign = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    this.validateStatusTransition(campaign.status, CampaignStatus.PROCESSING);

    if (campaign.validRecipients === 0) {
      throw new BadRequestException(
        'Cannot launch a campaign with zero valid recipients',
      );
    }

    if (!campaign.messageContentSnapshot) {
      throw new BadRequestException(
        'Campaign has no message content. Set a template or message content first.',
      );
    }

    // Snapshot template content at launch time (if using a template)
    if (campaign.templateId) {
      try {
        const template = await this.templatesService.checkTemplateExists(
          userId,
          campaign.templateId.toString(),
        );
        campaign.messageContentSnapshot = template.content;
      } catch {
        // Template may have been deleted; use existing snapshot
        this.logger.warn(
          `Template ${campaign.templateId.toString()} not found at launch time; using existing snapshot`,
        );
      }
    }

    campaign.status = CampaignStatus.PROCESSING;
    campaign.startedAt = new Date();
    await campaign.save();

    // Process first batch (non-blocking for the response)
    void this.processBatch(userId, campaignId);

    return campaign;
  }

  // ─── Pause ───────────────────────────────────────────────────────────

  async pauseCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignDocument> {
    const campaign = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    this.validateStatusTransition(campaign.status, CampaignStatus.PAUSED);

    campaign.status = CampaignStatus.PAUSED;
    campaign.pausedAt = new Date();
    return campaign.save();
  }

  // ─── Resume ──────────────────────────────────────────────────────────

  async resumeCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignDocument> {
    const campaign = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    this.validateStatusTransition(campaign.status, CampaignStatus.PROCESSING);

    campaign.status = CampaignStatus.PROCESSING;
    await campaign.save();

    // Continue processing from where we left off
    void this.processBatch(userId, campaignId);

    return campaign;
  }

  // ─── Cancel ──────────────────────────────────────────────────────────

  async cancelCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignDocument> {
    const campaign = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    this.validateStatusTransition(campaign.status, CampaignStatus.CANCELLED);

    // Skip all remaining pending recipients
    let skippedCount = 0;
    for (const recipient of campaign.recipients) {
      if (recipient.status === RecipientStatus.PENDING) {
        recipient.status = RecipientStatus.SKIPPED;
        skippedCount++;
      }
    }

    campaign.status = CampaignStatus.CANCELLED;
    campaign.cancelledAt = new Date();
    campaign.pendingCount = 0;

    return campaign.save();
  }

  // ─── Duplicate ───────────────────────────────────────────────────────

  async duplicateCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignDocument> {
    const original = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    return this.campaignModel.create({
      userId: new Types.ObjectId(userId),
      name: `${original.name} (Copy)`,
      description: original.description,
      status: CampaignStatus.DRAFT,
      templateId: original.templateId,
      messageContentSnapshot: original.messageContentSnapshot,
      defaultVariables: original.defaultVariables
        ? { ...original.defaultVariables }
        : null,
      recipients: original.recipients.map((r) => ({
        phoneNumber: r.phoneNumber,
        variables: r.variables ? { ...r.variables } : null,
        status: RecipientStatus.PENDING,
        messageId: null,
        processedAt: null,
      })),
      totalRecipients: original.totalRecipients,
      validRecipients: original.validRecipients,
      invalidRecipients: original.invalidRecipients,
      duplicateRecipients: original.duplicateRecipients,
      sentCount: 0,
      failedCount: 0,
      deliveredCount: 0,
      pendingCount: original.validRecipients,
      deviceId: original.deviceId,
      scheduleAt: null,
      processedIndex: 0,
    });
  }

  // ─── Stats ───────────────────────────────────────────────────────────

  async getCampaignStats(
    userId: string,
    campaignId: string,
  ): Promise<{
    id: string;
    name: string;
    status: string;
    totalRecipients: number;
    validRecipients: number;
    invalidRecipients: number;
    duplicateRecipients: number;
    pending: number;
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    skipped: number;
    progress: number;
    startedAt: Date | null;
    completedAt: Date | null;
  }> {
    const campaign = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    // Compute live counts from embedded recipients
    let pending = 0;
    let queued = 0;
    let sent = 0;
    let delivered = 0;
    let failed = 0;
    let skipped = 0;

    for (const r of campaign.recipients) {
      switch (r.status) {
        case RecipientStatus.PENDING:
          pending++;
          break;
        case RecipientStatus.QUEUED:
          queued++;
          break;
        case RecipientStatus.SENT:
          sent++;
          break;
        case RecipientStatus.DELIVERED:
          delivered++;
          break;
        case RecipientStatus.FAILED:
          failed++;
          break;
        case RecipientStatus.SKIPPED:
          skipped++;
          break;
      }
    }

    const processed = sent + delivered + failed + skipped;
    const total = campaign.validRecipients || 1;
    const progress = Math.round((processed / total) * 100);

    return {
      id: (campaign._id as { toString(): string }).toString(),
      name: campaign.name,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      validRecipients: campaign.validRecipients,
      invalidRecipients: campaign.invalidRecipients,
      duplicateRecipients: campaign.duplicateRecipients,
      pending,
      queued,
      sent,
      delivered,
      failed,
      skipped,
      progress,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
    };
  }

  // ─── Preview ─────────────────────────────────────────────────────────

  async previewCampaign(
    userId: string,
    campaignId: string,
  ): Promise<{
    totalRecipients: number;
    validRecipients: number;
    invalidRecipients: number;
    duplicateRecipients: number;
    sampleMessages: Array<{
      phoneNumber: string;
      renderedContent: string;
      characterCount: number;
      segmentsCount: number;
    }>;
  }> {
    const campaign = await this.findCampaignAndVerifyOwnership(
      userId,
      campaignId,
    );

    if (!campaign.messageContentSnapshot) {
      throw new BadRequestException('Campaign has no message content');
    }

    // Preview up to first 5 recipients
    const sampleRecipients = campaign.recipients.slice(0, 5);
    const sampleMessages = sampleRecipients.map((r) => {
      const variables: Record<string, string> = {
        ...(campaign.defaultVariables ?? {}),
        ...(r.variables ?? {}),
      };
      const renderedContent = this.templatesService.renderContent(
        campaign.messageContentSnapshot!,
        variables,
      );
      return {
        phoneNumber: r.phoneNumber,
        renderedContent,
        characterCount: renderedContent.length,
        segmentsCount: this.estimateSegments(renderedContent),
      };
    });

    return {
      totalRecipients: campaign.totalRecipients,
      validRecipients: campaign.validRecipients,
      invalidRecipients: campaign.invalidRecipients,
      duplicateRecipients: campaign.duplicateRecipients,
      sampleMessages,
    };
  }

  // ─── Process Scheduled Campaigns (external cron trigger) ────────────

  async processScheduledCampaigns(): Promise<{
    processed: number;
    campaignIds: string[];
  }> {
    const now = new Date();

    const scheduledCampaigns = await this.campaignModel
      .find({
        status: CampaignStatus.SCHEDULED,
        scheduleAt: { $lte: now },
      })
      .exec();

    const campaignIds: string[] = [];

    for (const campaign of scheduledCampaigns) {
      const campaignId = (
        campaign._id as { toString(): string }
      ).toString();

      campaign.status = CampaignStatus.PROCESSING;
      campaign.startedAt = new Date();
      await campaign.save();

      void this.processBatch(
        campaign.userId.toString(),
        campaignId,
      );

      campaignIds.push(campaignId);
    }

    return {
      processed: campaignIds.length,
      campaignIds,
    };
  }

  // ─── Update Campaign Message Status (called when message status changes) ─

  async updateRecipientStatus(
    campaignId: string,
    messageId: string,
    newStatus: RecipientStatus,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(campaignId)) {
      return;
    }

    const recipientStatusField = `recipients.$.status`;
    const recipientProcessedField = `recipients.$.processedAt`;

    await this.campaignModel.updateOne(
      {
        _id: new Types.ObjectId(campaignId),
        'recipients.messageId': new Types.ObjectId(messageId),
      },
      {
        $set: {
          [recipientStatusField]: newStatus,
          [recipientProcessedField]: new Date(),
        },
      },
    ).exec();

    // Update aggregate counts
    await this.refreshCampaignCounts(campaignId);
  }

  // ─── Response Serializer ────────────────────────────────────────────

  serializeCampaign(campaign: CampaignDocument) {
    const doc = campaign.toObject() as unknown as Record<string, unknown>;
    return {
      id: (campaign._id as { toString(): string }).toString(),
      name: doc.name,
      description: doc.description,
      status: doc.status,
      templateId: doc.templateId
        ? (doc.templateId as { toString(): string }).toString()
        : null,
      messageContentSnapshot: doc.messageContentSnapshot,
      defaultVariables: doc.defaultVariables,
      totalRecipients: doc.totalRecipients,
      validRecipients: doc.validRecipients,
      invalidRecipients: doc.invalidRecipients,
      duplicateRecipients: doc.duplicateRecipients,
      sentCount: doc.sentCount,
      failedCount: doc.failedCount,
      deliveredCount: doc.deliveredCount,
      pendingCount: doc.pendingCount,
      deviceId: doc.deviceId
        ? (doc.deviceId as { toString(): string }).toString()
        : null,
      scheduleAt: doc.scheduleAt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      pausedAt: doc.pausedAt,
      cancelledAt: doc.cancelledAt,
      processedIndex: doc.processedIndex,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  serializeCampaignWithRecipients(campaign: CampaignDocument) {
    const base = this.serializeCampaign(campaign);
    const doc = campaign.toObject() as unknown as Record<string, unknown>;
    const recipients = doc.recipients as Array<Record<string, unknown>>;

    return {
      ...base,
      recipients: recipients.map((r) => ({
        phoneNumber: r.phoneNumber,
        variables: r.variables,
        status: r.status,
        messageId: r.messageId
          ? (r.messageId as { toString(): string }).toString()
          : null,
        processedAt: r.processedAt,
      })),
    };
  }

  // ─── Batch Processing Engine ────────────────────────────────────────

  private async processBatch(
    userId: string,
    campaignId: string,
  ): Promise<void> {
    try {
      const campaign = await this.campaignModel.findById(campaignId).exec();
      if (!campaign) {
        return;
      }

      // Check if campaign is still in processing state
      if (campaign.status !== CampaignStatus.PROCESSING) {
        return;
      }

      const startIndex = campaign.processedIndex;
      const endIndex = Math.min(
        startIndex + BATCH_SIZE,
        campaign.recipients.length,
      );

      if (startIndex >= campaign.recipients.length) {
        // All recipients processed
        campaign.status = CampaignStatus.COMPLETED;
        campaign.completedAt = new Date();
        await campaign.save();
        await this.refreshCampaignCounts(campaignId);
        this.logger.log(`Campaign ${campaignId} completed`);
        return;
      }

      this.logger.log(
        `Processing campaign ${campaignId}: recipients ${startIndex}–${endIndex - 1}`,
      );

      for (let i = startIndex; i < endIndex; i++) {
        // Re-check status in case of pause/cancel during processing
        const freshCampaign = await this.campaignModel
          .findById(campaignId)
          .select('status')
          .exec();

        if (!freshCampaign || freshCampaign.status !== CampaignStatus.PROCESSING) {
          this.logger.log(
            `Campaign ${campaignId} is no longer processing (${freshCampaign?.status}), stopping batch`,
          );
          return;
        }

        const recipient = campaign.recipients[i]!;

        // Skip already processed recipients (idempotency)
        if (recipient.status !== RecipientStatus.PENDING) {
          continue;
        }

        // Merge default + per-recipient variables
        const variables: Record<string, string> = {
          ...(campaign.defaultVariables ?? {}),
          ...(recipient.variables ?? {}),
        };

        const renderedMessage = this.templatesService.renderContent(
          campaign.messageContentSnapshot!,
          variables,
        );

        // Validate rendered message length
        if (renderedMessage.length > 1600) {
          // Mark as failed — message too long after rendering
          await this.campaignModel.updateOne(
            { _id: campaign._id, 'recipients.phoneNumber': recipient.phoneNumber, [`recipients.${i}.status`]: RecipientStatus.PENDING },
            {
              $set: {
                [`recipients.${i}.status`]: RecipientStatus.FAILED,
                [`recipients.${i}.processedAt`]: new Date(),
              },
            },
          ).exec();
          continue;
        }

        try {
          // Send through existing pipeline
          const { message: messageDoc } = await this.messagesService.sendMessage(
            userId,
            null,
            {
              recipient: recipient.phoneNumber,
              message: renderedMessage,
              deviceId: campaign.deviceId?.toString(),
            },
            MessageSource.CAMPAIGN,
            (campaign._id as { toString(): string }).toString(),
          );

          const messageId = (
            messageDoc._id as { toString(): string }
          ).toString();

          // Update recipient with message reference
          await this.campaignModel.updateOne(
            { _id: campaign._id },
            {
              $set: {
                [`recipients.${i}.status`]: RecipientStatus.QUEUED,
                [`recipients.${i}.messageId`]: new Types.ObjectId(messageId),
                [`recipients.${i}.processedAt`]: new Date(),
              },
            },
          ).exec();
        } catch (error: unknown) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';

          this.logger.warn(
            `Campaign ${campaignId} recipient ${recipient.phoneNumber} failed: ${errorMsg}`,
          );

          await this.campaignModel.updateOne(
            { _id: campaign._id },
            {
              $set: {
                [`recipients.${i}.status`]: RecipientStatus.FAILED,
                [`recipients.${i}.processedAt`]: new Date(),
              },
            },
          ).exec();
        }
      }

      // Update processed index
      await this.campaignModel.updateOne(
        { _id: campaign._id },
        { $set: { processedIndex: endIndex } },
      ).exec();

      await this.refreshCampaignCounts(campaignId);

      // Check if more batches needed
      if (endIndex < campaign.recipients.length) {
        // Continue with next batch
        void this.processBatch(userId, campaignId);
      } else {
        // All done
        await this.campaignModel.updateOne(
          { _id: campaign._id },
          {
            $set: {
              status: CampaignStatus.COMPLETED,
              completedAt: new Date(),
            },
          },
        ).exec();
        await this.refreshCampaignCounts(campaignId);
        this.logger.log(`Campaign ${campaignId} completed`);
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Campaign ${campaignId} batch processing failed: ${errorMsg}`,
      );

      await this.campaignModel.updateOne(
        { _id: new Types.ObjectId(campaignId) },
        { $set: { status: CampaignStatus.FAILED } },
      ).exec();
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  private processRecipients(
    recipients: CampaignRecipientDto[],
  ): {
    valid: CampaignRecipientDto[];
    invalid: CampaignRecipientDto[];
    duplicates: number;
  } {
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    const seen = new Set<string>();
    const valid: CampaignRecipientDto[] = [];
    const invalid: CampaignRecipientDto[] = [];
    let duplicates = 0;

    for (const recipient of recipients) {
      // Normalize phone number
      const normalized = recipient.phoneNumber
        .trim()
        .replace(/[\s\-()]/g, '');

      if (!phoneRegex.test(normalized)) {
        invalid.push(recipient);
        continue;
      }

      if (seen.has(normalized)) {
        duplicates++;
        continue;
      }

      seen.add(normalized);
      valid.push({
        ...recipient,
        phoneNumber: normalized,
      });
    }

    return { valid, invalid, duplicates };
  }

  private validateStatusTransition(
    currentStatus: CampaignStatus,
    newStatus: CampaignStatus,
  ): void {
    const allowedTransitions = VALID_CAMPAIGN_TRANSITIONS[currentStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: "${currentStatus}" → "${newStatus}". ` +
          `Allowed transitions from "${currentStatus}": ${allowedTransitions?.join(', ') || 'none'}`,
      );
    }
  }

  private async refreshCampaignCounts(campaignId: string): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      return;
    }

    let pending = 0;
    let sent = 0;
    let delivered = 0;
    let failed = 0;

    for (const r of campaign.recipients) {
      switch (r.status) {
        case RecipientStatus.PENDING:
          pending++;
          break;
        case RecipientStatus.QUEUED:
        case RecipientStatus.SENT:
          sent++;
          break;
        case RecipientStatus.DELIVERED:
          delivered++;
          break;
        case RecipientStatus.FAILED:
          failed++;
          break;
      }
    }

    await this.campaignModel.updateOne(
      { _id: campaign._id },
      {
        $set: {
          pendingCount: pending,
          sentCount: sent,
          deliveredCount: delivered,
          failedCount: failed,
        },
      },
    ).exec();
  }

  private async findCampaignAndVerifyOwnership(
    userId: string,
    campaignId: string,
  ): Promise<CampaignDocument> {
    if (!Types.ObjectId.isValid(campaignId)) {
      throw new NotFoundException('Campaign not found');
    }

    const campaign = await this.campaignModel.findById(campaignId).exec();

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this campaign',
      );
    }

    return campaign;
  }

  private estimateSegments(text: string): number {
    const isGsm7 = /^[\x20-\x7E\n\r]*$/.test(text);
    const singleLimit = isGsm7 ? 160 : 70;
    const multiLimit = isGsm7 ? 153 : 67;

    if (text.length <= singleLimit) {
      return 1;
    }

    return Math.ceil(text.length / multiLimit);
  }
}
