import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { S3Provider } from '../s3/s3.provider';
import { getModelToken } from '@nestjs/mongoose';
import { FilePermissions } from './schemas/file-permissions.schema';
import { SharedLinks } from './schemas/shared-links.schema';
import { UsersService } from '@/../../src/users/users.service';
import { Model } from 'mongoose';
import * as crypto from 'crypto';

interface MockS3Provider {
  uploadFile: jest.Mock;
  getFile: jest.Mock;
  delete: jest.Mock;
  getAllFiles: jest.Mock;
}

interface MockFilePermissionsModel extends Partial<Model<FilePermissions>> {
  create?: jest.Mock;
  find?: jest.Mock;
  findOne?: jest.Mock;
}

interface MockSharedLinksModel extends Partial<Model<SharedLinks>> {
  create?: jest.Mock;
  findOne?: jest.Mock;
  new?: jest.Mock;
}

interface MockUsersService {
  findByCognitoId?: jest.Mock;
  findByEmail?: jest.Mock;
}

describe('FilesService', () => {
  let service: FilesService;
  const mockS3Provider: MockS3Provider = {
    uploadFile: jest.fn(),
    getFile: jest.fn(),
    delete: jest.fn(),
    getAllFiles: jest.fn(),
  };
  const mockFilePermissionsModel: MockFilePermissionsModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const mockSharedLinksModel: MockSharedLinksModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const mockUsersService: MockUsersService = {
    findByCognitoId: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockUUID = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format

  beforeEach(async () => {
    // Mock crypto.randomUUID with valid UUID format
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

    const mockQueryBuilder = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        {
          file_key: 'testUserId/shared-file.txt',
          shared_with: { email: 'test@example.com' },
          shared_at: new Date(),
        },
      ]),
    };

    // Mock FilePermissions Model
    const mockFilePermissionsModel = function (this: any, data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue(data),
        deleteOne: jest.fn().mockResolvedValue(true),
      };
    } as any;

    mockFilePermissionsModel.create = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
    }));
    mockFilePermissionsModel.find = jest.fn().mockReturnValue(mockQueryBuilder);
    mockFilePermissionsModel.findOne = jest.fn().mockImplementation(() => ({
      deleteOne: jest.fn().mockResolvedValue(true),
    }));

    // Mock SharedLinks Model
    const mockSharedLinksModel = function (this: any, data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...data, token: mockUUID }),
      };
    } as any;
    mockSharedLinksModel.create = jest.fn();
    mockSharedLinksModel.findOne = jest.fn().mockResolvedValue({
      file_key: 'testUserId/file1.txt',
      token: mockUUID,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: S3Provider, useValue: mockS3Provider },
        {
          provide: getModelToken(FilePermissions.name),
          useValue: mockFilePermissionsModel,
        },
        {
          provide: getModelToken(SharedLinks.name),
          useValue: mockSharedLinksModel,
        },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file', async () => {
    mockS3Provider.uploadFile.mockResolvedValue(true);
    const result = await service.uploadFile(
      {
        originalname: 'test.txt',
        buffer: Buffer.from('test'),
        mimetype: 'text/plain',
        size: 100,
      } as any,
      'testUserId',
    );
    expect(result.name).toBe('test.txt');
  });

  it('should get a file', async () => {
    mockS3Provider.getFile.mockResolvedValue({ buffer: Buffer.from('test') });
    const result = await service.getFile('test.txt', 'testUserId');
    expect(result.buffer.toString()).toBe('test');
  });

  it('should delete a file', async () => {
    mockS3Provider.delete.mockResolvedValue(true);
    const result = await service.remove('test.txt', 'testUserId');
    expect(result).toBe(true);
  });

  it('should share a file link', async () => {
    mockS3Provider.getFile.mockResolvedValue({ success: true });
    mockSharedLinksModel.findOne?.mockResolvedValue(null);

    const result = await service.shareLink('file1.txt', 'testUserId');
    expect(result).toBe(mockUUID);
  });

  it('should get a shared file by token', async () => {
    mockSharedLinksModel.findOne?.mockResolvedValue({
      file_key: 'testUserId/file1.txt',
    });
    mockS3Provider.getFile.mockResolvedValue({
      buffer: Buffer.from('test'),
      contentType: 'text/plain',
    });

    const result = await service.getSharedFile(mockUUID);
    expect(result).toEqual({
      buffer: Buffer.from('test'),
      contentType: 'text/plain',
      fileKey: 'file1.txt',
    });
  });

  it('should get file permissions', async () => {
    mockUsersService.findByCognitoId?.mockResolvedValue({ _id: 'ownerId' });

    const mockQueryBuilder = {
      populate: jest.fn().mockReturnThis(),
      exec: jest
        .fn()
        .mockResolvedValue([{ shared_with: { email: 'test@example.com' } }]),
    };

    mockFilePermissionsModel.find = jest.fn().mockReturnValue(mockQueryBuilder);

    const result = await service.getPermissions('file1.txt', 'testUserId');
    expect(result).toEqual(['test@example.com']);
  });
});
