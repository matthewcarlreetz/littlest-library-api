import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIClientService } from './openAiClient.service';

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe('OpenAIClientService', () => {
  let openAiClientService: OpenAIClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIClientService,
        {
          provide: 'OPENAI_API_KEY',
          useValue: 'test-api-key',
        },
      ],
    }).compile();

    openAiClientService = module.get<OpenAIClientService>(OpenAIClientService);
  });

  it('should be defined', () => {
    expect(openAiClientService).toBeDefined();
  });

  describe('prompt', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
    });

    it('should return a valid description', async () => {
      const mockFile = {
        buffer: Buffer.from('mock-image-data'),
      } as Express.Multer.File;

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'A library with books and a bench outside.',
            },
          },
        ],
      });

      const result = await openAiClientService.createLibraryDescription({
        image: mockFile,
        tags: 'tags',
      });
      expect(result).toEqual('A library with books and a bench outside.');
    });

    it('Throw an error when a description cannot be created', async () => {
      const mockFile = {
        buffer: Buffer.from('mock-image-data'),
      } as Express.Multer.File;

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'No',
            },
          },
        ],
      });

      await expect(
        openAiClientService.createLibraryDescription({
          image: mockFile,
          tags: 'tags',
        }),
      ).rejects.toThrow(
        'This image is invalid. Please try again with a different image',
      );
    });
  });
});
