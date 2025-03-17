import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadFile(file);
  }

  @Get()
  findAll() {
    return this.filesService.getAllFiles();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.filesService.getFile(key);
  }

  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.filesService.remove(key);
  }
}
