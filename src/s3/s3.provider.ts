import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  _Object,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Provider {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = this.configService.get('AWS_BUCKET_NAME');
  }

  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  async getFile(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const contentType = response.ContentType || 'application/octet-stream';
    const buffer = Buffer.from(await response.Body.transformToByteArray());

    return {
      buffer,
      contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  // get all the files in the bucket
  async getAllFiles(userId: string): Promise<_Object[]> {
    const command = new ListObjectsCommand({
      Bucket: this.bucket,
      Prefix: `${userId}/`,
    });

    const response = await this.s3Client.send(command);
    if (!response.Contents) {
      return [];
    }
    return response.Contents;
  }

  // create folder in the bucket
  async createFolder(folderName: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: `${folderName}/`,
      Body: '',
    });

    await this.s3Client.send(command);
  }
}
