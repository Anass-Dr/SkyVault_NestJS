import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type FilePermissionsDocument = HydratedDocument<FilePermissions>;

@Schema()
export class FilePermissions {
  @Prop({ required: true })
  file_key: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  shared_with: User;

  @Prop({ required: true, default: Date.now })
  shared_at: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: User;
}

export const FilePermissionsSchema =
  SchemaFactory.createForClass(FilePermissions);
