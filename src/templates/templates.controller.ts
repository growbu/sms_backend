import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TemplatesService } from './templates.service.js';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  QueryTemplatesDto,
  PreviewTemplateDto,
} from './dto/index.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // POST /templates
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTemplateDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const template = await this.templatesService.createTemplate(userId, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Template created successfully',
      data: this.templatesService.serializeTemplate(template),
    };
  }

  // GET /templates
  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryTemplatesDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const result = await this.templatesService.listTemplates(userId, query);

    return {
      statusCode: HttpStatus.OK,
      data: {
        templates: result.templates.map((t) =>
          this.templatesService.serializeTemplate(t),
        ),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
    };
  }

  // GET /templates/:id
  @Get(':id')
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') templateId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const template = await this.templatesService.getTemplate(userId, templateId);

    return {
      statusCode: HttpStatus.OK,
      data: this.templatesService.serializeTemplate(template),
    };
  }

  // PATCH /templates/:id
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') templateId: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const template = await this.templatesService.updateTemplate(
      userId,
      templateId,
      dto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Template updated successfully',
      data: this.templatesService.serializeTemplate(template),
    };
  }

  // DELETE /templates/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id') templateId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    await this.templatesService.deleteTemplate(userId, templateId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Template deleted successfully',
    };
  }

  // POST /templates/:id/duplicate
  @Post(':id/duplicate')
  async duplicate(
    @Req() req: AuthenticatedRequest,
    @Param('id') templateId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const template = await this.templatesService.duplicateTemplate(
      userId,
      templateId,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Template duplicated successfully',
      data: this.templatesService.serializeTemplate(template),
    };
  }

  // POST /templates/:id/preview
  @Post(':id/preview')
  @HttpCode(HttpStatus.OK)
  async preview(
    @Req() req: AuthenticatedRequest,
    @Param('id') templateId: string,
    @Body() dto: PreviewTemplateDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const result = await this.templatesService.previewTemplate(
      userId,
      templateId,
      dto,
    );

    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
