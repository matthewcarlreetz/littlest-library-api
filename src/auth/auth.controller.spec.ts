import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { RegisterRequestDto } from './dtos/register-request.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw BadRequestException if email is invalid', async () => {
      const validationPipe = new ValidationPipe({ transform: true });

      const invalidRegisterDto: RegisterRequestDto = {
        email: 'invalid-email',
        password: 'ValidPassword123!',
      };

      let error: unknown = null;

      try {
        await validationPipe.transform(invalidRegisterDto, {
          type: 'body',
          metatype: RegisterRequestDto,
        });
        await authController.register(invalidRegisterDto);
      } catch (err) {
        error = err;
      }

      expect(authService.register).not.toHaveBeenCalled();
      expect(error).toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if password is invalid', async () => {
      const validationPipe = new ValidationPipe({ transform: true });

      const invalidRegisterDto: RegisterRequestDto = {
        email: 'valid@email.com',
        password: 'short',
      };

      let error: unknown = null;

      try {
        await validationPipe.transform(invalidRegisterDto, {
          type: 'body',
          metatype: RegisterRequestDto,
        });
        await authController.register(invalidRegisterDto);
      } catch (err) {
        error = err;
      }

      expect(authService.register).not.toHaveBeenCalled();
      expect(error).toBeInstanceOf(BadRequestException);
    });
  });
});
