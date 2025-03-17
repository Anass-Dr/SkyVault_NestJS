import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { S3Provider } from './s3.provider';

@Module({
  controllers: [FilesController],
  providers: [FilesService, S3Provider],
})
export class FilesModule {}
