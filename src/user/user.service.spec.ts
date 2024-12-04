import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient, User } from '@prisma/client';

describe('UserService', () => {
  let userService: UserService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    userService = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('user', () => {
    it('should return a user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.user({ id: mockUser.id });

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null when no user is found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.user({ id: 999 });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user when found by email', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await userService.findOneByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it('should return null when no user is found by email', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await userService.findOneByEmail('notfound@example.com');

      expect(result).toBeNull();
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'notfound@example.com' },
      });
    });
  });

  describe('users', () => {
    it('should return a list of users', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await userService.users({});

      expect(result).toEqual([mockUser]);
      expect(prisma.user.findMany).toHaveBeenCalledWith({});
    });
  });

  describe('createUser', () => {
    it('should create and return a user', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const data = {
        email: mockUser.email,
        password: mockUser.password,
      };
      const result = await userService.createUser(data);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete and return the deleted user', async () => {
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await userService.deleteUser({ id: mockUser.id });

      expect(result).toEqual(mockUser);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });
  });
});
