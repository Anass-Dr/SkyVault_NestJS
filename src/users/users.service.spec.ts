import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  const mockUserModel = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all users except the given cognitoId', async () => {
    mockUserModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        {
          email: 'test@example.com',
          toJSON: jest.fn().mockReturnValue({ email: 'test@example.com' }),
        },
      ]),
    });
    const result = await service.findAll('testCognitoId');
    expect(result).toHaveLength(1);
  });

  it('should find a user by email', async () => {
    mockUserModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
    });
    const result = await service.findByEmail('test@example.com');
    expect(result.email).toBe('test@example.com');
  });

  it('should find a user by cognitoId', async () => {
    mockUserModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ cognitoId: 'testCognitoId' }),
    });
    const result = await service.findByCognitoId('testCognitoId');
    expect(result.cognitoId).toBe('testCognitoId');
  });
});
