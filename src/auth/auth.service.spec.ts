import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterRequestDto } from './dtos/register-request.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOneByEmail: jest.fn(),
            createUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  describe('login', () => {
    it('should return an access token for valid user', async () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      const token = 'accessToken';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await authService.login(user);

      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        id: user.id,
      });
    });

    it('should throw BadRequestException for invalid user', async () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      const result = await authService.login(user);

      expect(result.access_token).toBeUndefined();
    });
  });

  describe('validateUser', () => {
    it('should return user if email and password are valid', async () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      jest.spyOn(userService, 'findOneByEmail').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

      const result = await authService.validateUser(user.email, 'password');

      expect(result).toEqual(user);
    });

    it('should throw BadRequestException if user is not found', async () => {
      jest.spyOn(userService, 'findOneByEmail').mockResolvedValue(null);

      await expect(
        authService.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password does not match', async () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      jest.spyOn(userService, 'findOneByEmail').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

      await expect(
        authService.validateUser(user.email, 'wrongPassword'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('register', () => {
    it('should return access token for valid registration', async () => {
      const registerDto: RegisterRequestDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      const token = 'accessToken';
      jest.spyOn(userService, 'findOneByEmail').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      jest.spyOn(userService, 'createUser').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await authService.register(registerDto);

      expect(result).toEqual({ access_token: token });
    });

    it('should throw BadRequestException if email already exists', async () => {
      const registerDto: RegisterRequestDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const existingUser: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      jest.spyOn(userService, 'findOneByEmail').mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
