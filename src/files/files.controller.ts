import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpException,
  Body,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post(':userId')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    const fileData = await this.filesService.uploadFile(file, userId);
    return { message: 'File uploaded', fileData };
  }

  @Get(':userId')
  findAll(@Param('userId') userId: string) {
    return this.filesService.getAllFiles(userId);
  }

  @Get('shared-link/:token')
  async getSharedFileByLink(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    try {
      const { buffer, fileKey } = await this.filesService.getSharedFile(token);
      return res.json({
        fileKey: fileKey,
        fileData: buffer.toString('base64'),
      });
    } catch (error: any) {
      throw new HttpException(
        'Error retrieving file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('shared-permission/:key/:userId')
  async getSharedFileByPermission(
    @Param('key') fileKey: string,
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      const { buffer, contentType } =
        await this.filesService.getSharedFileByPermission(fileKey, userId);
      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(fileKey)}"`,
      );
      res.setHeader('Content-Length', buffer.length);

      // Send the file directly
      return res.send(buffer);
    } catch (error: any) {
      throw new HttpException(
        'Error retrieving file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':key/permissions/:userId')
  async getPermissions(
    @Param('key') key: string,
    @Param('userId') userId: string,
  ) {
    return this.filesService.getPermissions(key, userId);
  }

  @Get(':key/:userId')
  async findOne(
    @Param('key') key: string,
    @Res() res: Response,
    @Param('userId') userId: string,
  ) {
    try {
      const { buffer, contentType } = await this.filesService.getFile(
        key,
        userId,
      );

      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(key)}"`,
      );
      res.setHeader('Content-Length', buffer.length);

      // Send the file directly
      return res.send(buffer);
    } catch (error: any) {
      throw new HttpException(
        'Error retrieving file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':key/:userId')
  remove(@Param('key') key: string, @Param('userId') userId: string) {
    return this.filesService.remove(key, userId);
  }

  @Get(':key/share-link/:userId')
  async shareLink(@Param('key') key: string, @Param('userId') userId: string) {
    const token = await this.filesService.shareLink(key, userId);
    return { token };
  }

  @Post(':key/permissions/:userId')
  async addPermission(
    @Param('key') key: string,
    @Param('userId') userId: string,
    @Body('email') email: string,
  ) {
    return this.filesService.addPermission(key, email, userId);
  }

  @Delete(':key/permissions/:email/:userId')
  async removePermission(
    @Param('key') key: string,
    @Param('email') email: string,
    @Param('userId') userId: string,
  ) {
    return this.filesService.removePermission(key, email, userId);
  }
}
