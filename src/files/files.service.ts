import { Injectable } from '@nestjs/common';
import { S3Provider } from './s3.provider';

@Injectable()
export class FilesService {
  private readonly userId = '678be9cd310474e977dd896a';

  constructor(private readonly S3Service: S3Provider) {}

  async uploadFile(file: Express.Multer.File) {
    return this.S3Service.uploadFile(
      `${this.userId}/${file.originalname}`,
      file.buffer,
      file.mimetype,
    );
  }

  async getFile(key: string) {
    return this.S3Service.getFile(`${this.userId}/${key}`);
  }

  async remove(key: string) {
    return this.S3Service.deleteFile(`${this.userId}/${key}`);
  }

  async getAllFiles() {
    const files = await this.S3Service.getAllFiles();
    return files.map((file) => {
      return {
        name: file.Key.split('/').pop(),
        type: file.Key.split('.').pop(),
        url: `${process.env.SERVER_URL}/api/files/${file.Key}`,
        size: file.Size,
        lastModified: file.LastModified,
      };
    });
  }
}
