import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { S3Module } from 'src/s3/s3.module';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FilePermissions, FilePermissionsSchema } from './schemas/file-permissions.schema';
import { SharedLinks, SharedLinksSchema } from './schemas/shared-links.schema';

@Module({
  imports: [S3Module, UsersModule, MongooseModule.forFeature([
    { name: FilePermissions.name, schema: FilePermissionsSchema },
    { name: SharedLinks.name, schema: SharedLinksSchema },
  ])],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
