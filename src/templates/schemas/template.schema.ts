import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({ timestamps: true })
export class Template {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  slug!: string;

  @Prop({ type: String, default: null, trim: true, index: true })
  category!: string | null;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: [String], default: [] })
  variables!: string[];

  @Prop({ default: 'en', trim: true, index: true })
  language!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: 1 })
  version!: number;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

// Unique slug per user
TemplateSchema.index({ userId: 1, slug: 1 }, { unique: true });
// Dashboard queries
TemplateSchema.index({ userId: 1, category: 1, createdAt: -1 });
TemplateSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
