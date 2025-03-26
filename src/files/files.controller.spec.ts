import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  const mockFilesService = {
    uploadFile: jest.fn(),
    getAllFiles: jest.fn(),
    getFile: jest.fn(),
    remove: jest.fn(),
    shareLink: jest.fn(),
    getSharedFile: jest.fn(),
    getSharedFileByPermission: jest.fn(),
    getPermissions: jest.fn(),
    addPermission: jest.fn(),
    removePermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should upload a file', async () => {
    mockFilesService.uploadFile.mockResolvedValue({ name: 'test.txt' });
    const result = await controller.upload(
      { originalname: 'test.txt' } as any,
      'testUserId',
    );
    expect(result.fileData.name).toBe('test.txt');
  });

  it('should get all files', async () => {
    mockFilesService.getAllFiles.mockResolvedValue([{ name: 'test.txt' }]);
    const result = await controller.findAll('testUserId');
    expect(result).toHaveLength(1);
  });

  it('should delete a file', async () => {
    mockFilesService.remove.mockResolvedValue(true);
    const result = await controller.remove('test.txt', 'testUserId');
    expect(result).toBe(true);
  });

  it('should get a file by key', async () => {
    mockFilesService.getFile.mockResolvedValue({
      buffer: Buffer.from('file content'),
      contentType: 'text/plain',
    });
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as any;
    await controller.findOne('testKey', mockRes, 'testUserId');
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain',
    );
    expect(mockRes.send).toHaveBeenCalledWith(Buffer.from('file content'));
  });

  it('should get shared file by link', async () => {
    mockFilesService.getSharedFile.mockResolvedValue({
      buffer: Buffer.from('shared file content'),
      fileKey: 'sharedKey',
    });
    const mockRes = {
      json: jest.fn(),
    } as any;
    await controller.getSharedFileByLink('testToken', mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({
      fileKey: 'sharedKey',
      fileData: Buffer.from('shared file content').toString('base64'),
    });
  });

  it('should get shared file by permission', async () => {
    mockFilesService.getSharedFileByPermission.mockResolvedValue({
      buffer: Buffer.from('shared permission file content'),
      contentType: 'text/plain',
    });
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as any;
    await controller.getSharedFileByPermission(
      'testKey',
      'testUserId',
      mockRes,
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain',
    );
    expect(mockRes.send).toHaveBeenCalledWith(
      Buffer.from('shared permission file content'),
    );
  });

  it('should get permissions for a file', async () => {
    mockFilesService.getPermissions.mockResolvedValue(['read', 'write']);
    const result = await controller.getPermissions('testKey', 'testUserId');
    expect(result).toEqual(['read', 'write']);
  });

  it('should share a file link', async () => {
    mockFilesService.shareLink.mockResolvedValue('testToken');
    const result = await controller.shareLink('testKey', 'testUserId');
    expect(result).toEqual({ token: 'testToken' });
  });

  it('should add permission to a file', async () => {
    mockFilesService.addPermission.mockResolvedValue({ success: true });
    const result = await controller.addPermission(
      'testKey',
      'testUserId',
      'test@example.com',
    );
    expect(result).toEqual({ success: true });
  });

  it('should remove permission from a file', async () => {
    mockFilesService.removePermission.mockResolvedValue({ success: true });
    const result = await controller.removePermission(
      'testKey',
      'test@example.com',
      'testUserId',
    );
    expect(result).toEqual({ success: true });
  });
});
