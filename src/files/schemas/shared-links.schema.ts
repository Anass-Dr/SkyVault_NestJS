import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SharedLinksDocument = HydratedDocument<SharedLinks>;

@Schema()
export class SharedLinks {
  @Prop({ required: true })
  file_key: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, default: Date.now })
  created_at: Date;
}

export const SharedLinksSchema = SchemaFactory.createForClass(SharedLinks);
