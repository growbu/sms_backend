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
import { CampaignsService } from './campaigns.service.js';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  QueryCampaignsDto,
} from './dto/index.js';
import type { UserDocument } from '../user/schemas/user.schema.js';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // POST /campaigns
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCampaignDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const campaign = await this.campaignsService.createCampaign(userId, dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Campaign created successfully',
      data: this.campaignsService.serializeCampaign(campaign),
    };
  }

  // GET /campaigns
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryCampaignsDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const result = await this.campaignsService.listCampaigns(userId, query);

    return {
      statusCode: HttpStatus.OK,
      data: {
        campaigns: result.campaigns.map((c) =>
          this.campaignsService.serializeCampaign(c),
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

  // GET /campaigns/:id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const campaign = await this.campaignsService.getCampaign(
      userId,
      campaignId,
    );

    return {
      statusCode: HttpStatus.OK,
      data: this.campaignsService.serializeCampaignWithRecipients(campaign),
    };
  }

  // PATCH /campaigns/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const campaign = await this.campaignsService.updateCampaign(
      userId,
      campaignId,
      dto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Campaign updated successfully',
      data: this.campaignsService.serializeCampaign(campaign),
    };
  }

  // DELETE /campaigns/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    await this.campaignsService.deleteCampaign(userId, campaignId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Campaign deleted successfully',
    };
  }

  // POST /campaigns/:id/launch
  @Post(':id/launch')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async launch(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const campaign = await this.campaignsService.launchCampaign(
      userId,
      campaignId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Campaign launched. Messages are being dispatched.',
      data: this.campaignsService.serializeCampaign(campaign),
    };
  }

  // POST /campaigns/:id/pause
  @Post(':id/pause')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async pause(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const campaign = await this.campaignsService.pauseCampaign(
      userId,
      campaignId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Campaign paused',
      data: this.campaignsService.serializeCampaign(campaign),
    };
  }

  // POST /campaigns/:id/resume
  @Post(':id/resume')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resume(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const campaign = await this.campaignsService.resumeCampaign(
      userId,
      campaignId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Campaign resumed',
      data: this.campaignsService.serializeCampaign(campaign),
    };
  }

  // POST /campaigns/:id/cancel
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const campaign = await this.campaignsService.cancelCampaign(
      userId,
      campaignId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Campaign cancelled',
      data: this.campaignsService.serializeCampaign(campaign),
    };
  }

  // POST /campaigns/:id/duplicate
  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  async duplicate(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const campaign = await this.campaignsService.duplicateCampaign(
      userId,
      campaignId,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Campaign duplicated as draft',
      data: this.campaignsService.serializeCampaign(campaign),
    };
  }

  // GET /campaigns/:id/stats
  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  async stats(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const stats = await this.campaignsService.getCampaignStats(
      userId,
      campaignId,
    );

    return {
      statusCode: HttpStatus.OK,
      data: stats,
    };
  }

  // POST /campaigns/:id/preview
  @Post(':id/preview')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async preview(
    @Req() req: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    const userId = (req.user._id as { toString(): string }).toString();
    const result = await this.campaignsService.previewCampaign(
      userId,
      campaignId,
    );

    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  // POST /campaigns/process-scheduled (external cron trigger)
  @Post('process-scheduled')
  @HttpCode(HttpStatus.OK)
  async processScheduled() {
    const result = await this.campaignsService.processScheduledCampaigns();

    return {
      statusCode: HttpStatus.OK,
      message: `Processed ${result.processed} scheduled campaign(s)`,
      data: result,
    };
  }
}
