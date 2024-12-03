import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIClientService } from './openAiClient.service';

// Mock the 'openai' module
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'response' } }],
          }),
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
          useValue: 'test-api-key', // Mock API key
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

    it('should return a string', async () => {
      const mockFile = {
        buffer: Buffer.from('mock-image-data'),
      } as Express.Multer.File;

      const result = await openAiClientService.createLibraryDescription({
        image: mockFile,
        tags: 'tags',
      });
      expect(result).toEqual('response');
    });
  });
});
