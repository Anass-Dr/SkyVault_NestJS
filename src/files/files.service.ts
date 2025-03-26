import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Provider } from '../s3/s3.provider';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FilePermissions } from './schemas/file-permissions.schema';
import { SharedLinks } from './schemas/shared-links.schema';
import * as crypto from 'crypto';
import { UsersService } from '@/../../src/users/users.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly S3Service: S3Provider,
    @InjectModel(FilePermissions.name)
    private readonly filePermissionsModel: Model<FilePermissions>,
    @InjectModel(SharedLinks.name)
    private readonly sharedLinksModel: Model<SharedLinks>,
    private readonly usersService: UsersService,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string) {
    try {
      await this.S3Service.uploadFile(
        `${userId}/${file.originalname}`,
        file.buffer,
        file.mimetype,
      );
      return {
        name: file.originalname,
        type: file.originalname.split('.').pop(),
        size: file.size,
        lastModified: new Date(),
      };
    } catch (error: any) {
      throw new BadRequestException({ message: error.message });
    }
  }

  async getFile(key: string, userId: string) {
    try {
      return await this.S3Service.getFile(`${userId}/${key}`);
    } catch (error: any) {
      throw new BadRequestException('File not found');
    }
  }

  async remove(key: string, userId: string) {
    return this.S3Service.delete(`${userId}/${key}`);
  }

  async getAllFiles(userId: string) {
    const files = await this.S3Service.getAllFiles(userId);
    const user = await this.usersService.findByCognitoId(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const sharedPermissions = await this.filePermissionsModel
      .find({ shared_with: user._id })
      .populate('owner')
      .exec();

    const ownedFiles = files
      .filter(
        (file) => file.Key.startsWith(`${userId}/`) && !file.Key.endsWith('/'),
      )
      .map((file) => {
        const key = file.Key.slice(userId.length + 1);
        return {
          name: key,
          type: key.split('.').pop() || 'unknown',
          size: file.Size,
          lastModified: file.LastModified,
          isShared: false,
        };
      });

    const sharedFiles = [];
    for (const permission of sharedPermissions) {
      const file = await this.S3Service.getFile(`${permission.file_key}`);
      if (!file) continue;

      sharedFiles.push({
        name: permission.file_key.split('/').pop(),
        type: permission.file_key.split('.').pop() || 'unknown',
        size: file.buffer.length,
        lastModified: permission.shared_at,
        isShared: true,
        sharedBy: permission.owner.username,
      });
    }

    return [...ownedFiles, ...sharedFiles];
  }

  async shareLink(key: string, userId: string) {
    const fileExists = await this.S3Service.getFile(`${userId}/${key}`);
    if (!fileExists) {
      throw new BadRequestException('File not found');
    }

    const existingLink = await this.sharedLinksModel.findOne({ file_key: key });
    if (existingLink) {
      return existingLink.token;
    }

    const token = crypto.randomUUID();
    const newSharedLink = new this.sharedLinksModel({
      file_key: `${userId}/${key}`,
      token,
    });
    await newSharedLink.save();

    return token;
  }

  async getSharedFile(token: string) {
    const link = await this.sharedLinksModel.findOne({ token });
    if (!link) {
      throw new BadRequestException('Invalid token');
    }
    const result = await this.S3Service.getFile(link.file_key);
    if (!result) {
      throw new BadRequestException('File not found');
    }
    return { ...result, fileKey: link.file_key.split('/').pop() };
  }

  async getSharedFileByPermission(fileKey: string, userId: string) {
    const shared_with = await this.usersService.findByCognitoId(userId);
    if (!shared_with) throw new BadRequestException('User not found');

    const filePermission = await this.filePermissionsModel.findOne({
      file_key: { $regex: fileKey, $options: 'i' },
      shared_with: shared_with._id,
    });
    if (!filePermission) {
      throw new BadRequestException('Permission not found');
    }
    return this.S3Service.getFile(filePermission.file_key);
  }

  async addPermission(key: string, email: string, userId: string) {
    const fileExists = await this.S3Service.getFile(`${userId}/${key}`).catch(
      () => null,
    );
    if (!fileExists) {
      throw new BadRequestException('File not found');
    }

    const targetUser = await this.usersService.findByEmail(email);
    if (!targetUser) {
      throw new BadRequestException('Target user not found');
    }
    const user = await this.usersService.findByCognitoId(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newPermission = new this.filePermissionsModel({
      file_key: `${userId}/${key}`,
      shared_with: targetUser._id,
      owner: user._id,
    });
    await newPermission.save();

    return { message: 'Permission added successfully' };
  }

  async removePermission(key: string, email: string, userId: string) {
    const fileExists = await this.S3Service.getFile(`${userId}/${key}`);
    if (!fileExists) {
      throw new BadRequestException('File not found');
    }

    const sharedWithUser = await this.usersService.findByEmail(email);
    if (!sharedWithUser) {
      throw new BadRequestException('sharedWithUser not found');
    }

    const user = await this.usersService.findByCognitoId(userId);
    if (!user) throw new BadRequestException('User not found');

    const permission = await this.filePermissionsModel.findOne({
      file_key: `${userId}/${key}`,
      shared_with: sharedWithUser._id,
      owner: user._id,
    });
    if (!permission) {
      throw new BadRequestException('Permission not found');
    }

    await permission.deleteOne();

    return { message: 'Permission removed successfully' };
  }

  async getPermissions(key: string, userId: string) {
    const user = await this.usersService.findByCognitoId(userId);
    if (!user) throw new BadRequestException('User not found');
    const permissions = await this.filePermissionsModel
      .find({ file_key: `${userId}/${key}`, owner: user._id })
      .populate('shared_with')
      .exec();
    return permissions.map((permission) => permission.shared_with.email);
  }
}
