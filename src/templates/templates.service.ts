import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema.js';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  QueryTemplatesDto,
  PreviewTemplateDto,
} from './dto/index.js';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────

  async createTemplate(
    userId: string,
    dto: CreateTemplateDto,
  ): Promise<TemplateDocument> {
    const variables = this.extractVariables(dto.content);
    const slug = await this.generateUniqueSlug(userId, dto.name);

    return this.templateModel.create({
      userId: new Types.ObjectId(userId),
      name: dto.name.trim(),
      slug,
      category: dto.category?.trim() ?? null,
      content: dto.content,
      variables,
      language: dto.language?.trim() ?? 'en',
      isActive: dto.isActive ?? true,
      version: 1,
    });
  }

  // ─── Update ──────────────────────────────────────────────────────────

  async updateTemplate(
    userId: string,
    templateId: string,
    dto: UpdateTemplateDto,
  ): Promise<TemplateDocument> {
    const template = await this.findTemplateAndVerifyOwnership(
      userId,
      templateId,
    );

    const updateFields: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      updateFields.name = dto.name.trim();
      updateFields.slug = await this.generateUniqueSlug(
        userId,
        dto.name,
        templateId,
      );
    }
    if (dto.content !== undefined) {
      updateFields.content = dto.content;
      updateFields.variables = this.extractVariables(dto.content);
      updateFields.version = template.version + 1;
    }
    if (dto.category !== undefined) {
      updateFields.category = dto.category.trim() || null;
    }
    if (dto.language !== undefined) {
      updateFields.language = dto.language.trim();
    }
    if (dto.isActive !== undefined) {
      updateFields.isActive = dto.isActive;
    }

    if (Object.keys(updateFields).length === 0) {
      return template;
    }

    const updated = await this.templateModel
      .findByIdAndUpdate(templateId, { $set: updateFields }, { new: true })
      .exec();

    return updated!;
  }

  // ─── Delete ──────────────────────────────────────────────────────────

  async deleteTemplate(
    userId: string,
    templateId: string,
  ): Promise<void> {
    const template = await this.findTemplateAndVerifyOwnership(
      userId,
      templateId,
    );
    await template.deleteOne();
  }

  // ─── Check if Template is Deletable (used by campaigns module) ─────

  async checkTemplateExists(
    userId: string,
    templateId: string,
  ): Promise<TemplateDocument> {
    return this.findTemplateAndVerifyOwnership(userId, templateId);
  }

  // ─── Get Single ──────────────────────────────────────────────────────

  async getTemplate(
    userId: string,
    templateId: string,
  ): Promise<TemplateDocument> {
    return this.findTemplateAndVerifyOwnership(userId, templateId);
  }

  // ─── List with Pagination ────────────────────────────────────────────

  async listTemplates(
    userId: string,
    query: QueryTemplatesDto,
  ): Promise<{
    templates: TemplateDocument[];
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

    if (query.category) {
      filter.category = query.category.trim();
    }
    if (query.language) {
      filter.language = query.language.trim();
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }
    if (query.search) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }

    const [templates, total] = await Promise.all([
      this.templateModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.templateModel.countDocuments(filter).exec(),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Duplicate ───────────────────────────────────────────────────────

  async duplicateTemplate(
    userId: string,
    templateId: string,
  ): Promise<TemplateDocument> {
    const original = await this.findTemplateAndVerifyOwnership(
      userId,
      templateId,
    );

    const newName = `${original.name} (Copy)`;
    const slug = await this.generateUniqueSlug(userId, newName);

    return this.templateModel.create({
      userId: new Types.ObjectId(userId),
      name: newName,
      slug,
      category: original.category,
      content: original.content,
      variables: [...original.variables],
      language: original.language,
      isActive: true,
      version: 1,
    });
  }

  // ─── Preview / Render ────────────────────────────────────────────────

  async previewTemplate(
    userId: string,
    templateId: string,
    dto: PreviewTemplateDto,
  ): Promise<{
    renderedContent: string;
    variables: string[];
    missingVariables: string[];
    characterCount: number;
    segmentsCount: number;
  }> {
    const template = await this.findTemplateAndVerifyOwnership(
      userId,
      templateId,
    );

    const variables = dto.variables ?? {};
    const renderedContent = this.renderContent(template.content, variables);
    const missingVariables = template.variables.filter(
      (v) => !(v in variables),
    );

    return {
      renderedContent,
      variables: template.variables,
      missingVariables,
      characterCount: renderedContent.length,
      segmentsCount: this.estimateSegments(renderedContent),
    };
  }

  // ─── Render Content (used by campaigns module) ──────────────────────

  renderContent(
    content: string,
    variables: Record<string, string>,
  ): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, varName: string) => {
      if (varName in variables) {
        return variables[varName]!;
      }
      return match; // Leave unresolved placeholders as-is
    });
  }

  // ─── Response Serializer ────────────────────────────────────────────

  serializeTemplate(template: TemplateDocument) {
    const doc = template.toObject() as unknown as Record<string, unknown>;
    return {
      id: (template._id as { toString(): string }).toString(),
      name: doc.name,
      slug: doc.slug,
      category: doc.category,
      content: doc.content,
      variables: doc.variables,
      language: doc.language,
      isActive: doc.isActive,
      version: doc.version,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]!);
    }

    return Array.from(variables);
  }

  private async generateUniqueSlug(
    userId: string,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug || 'template';
    let suffix = 1;

    while (true) {
      const filter: Record<string, unknown> = {
        userId: new Types.ObjectId(userId),
        slug,
      };

      if (excludeId) {
        filter._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const existing = await this.templateModel.findOne(filter).exec();
      if (!existing) {
        return slug;
      }

      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }
  }

  private async findTemplateAndVerifyOwnership(
    userId: string,
    templateId: string,
  ): Promise<TemplateDocument> {
    if (!Types.ObjectId.isValid(templateId)) {
      throw new NotFoundException('Template not found');
    }

    const template = await this.templateModel.findById(templateId).exec();

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this template',
      );
    }

    return template;
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
