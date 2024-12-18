import { Test, TestingModule } from '@nestjs/testing';
import { LibraryService } from './library.service';
import { PrismaService } from 'utils/prisma/prisma.service';
import { OpenAIClientService } from 'utils/openAiClient/openAiClient.service';
import { GeocodingService } from 'utils/geocoding/geocoding.service';
import { ImageUploadService } from 'utils/imageUpload/imageUpload.service';
import { Library, Prisma, PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('utils/openAiClient/openAiClient.service');
jest.mock('utils/geocoding/geocoding.service');
jest.mock('utils/imageUpload/imageUpload.service');

const mockLibraryDto = {
  lat: 52.52,
  lng: 13.405,
  tags: 'tag1,tag2',
};
const mockUser = {
  id: 1,
  email: 'test@test.com',
  password: 'tacos1234',
};

describe('LibraryService', () => {
  let libraryService: LibraryService;
  let prismaService: PrismaService;
  let openAiClientService: OpenAIClientService;
  let geocodingService: GeocodingService;
  let imageUploadService: ImageUploadService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibraryService,
        PrismaService,
        OpenAIClientService,
        GeocodingService,
        ImageUploadService,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    libraryService = module.get<LibraryService>(LibraryService);
    prismaService = module.get<PrismaService>(PrismaService);
    openAiClientService = module.get<OpenAIClientService>(OpenAIClientService);
    geocodingService = module.get<GeocodingService>(GeocodingService);
    imageUploadService = module.get<ImageUploadService>(ImageUploadService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(libraryService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new library', async () => {
      (
        openAiClientService.createLibraryDescription as jest.Mock
      ).mockResolvedValue('Mocked description');

      (geocodingService.getAddressComponents as jest.Mock).mockResolvedValue({
        street: '123 Mock St',
        city: 'Mock City',
        state: 'Mock State',
        zip: '12345',
      });

      (imageUploadService.uploadImage as jest.Mock).mockResolvedValue(
        'http://mocked-image-url.com',
      );

      prisma.library.create.mockResolvedValue({
        id: 'new-library-id',
        lat: new Prisma.Decimal(mockLibraryDto.lat),
        lng: new Prisma.Decimal(mockLibraryDto.lng),
        creatorId: mockUser.id,
      });

      prisma.library.findMany.mockResolvedValue([]);

      const result = await libraryService.create({
        library: mockLibraryDto,
        user: mockUser,
        image: null,
      });

      expect(result).toBeDefined();
      expect(prismaService.library.create).toHaveBeenCalled();
      expect(openAiClientService.createLibraryDescription).toHaveBeenCalled();
      expect(geocodingService.getAddressComponents).toHaveBeenCalled();
      expect(imageUploadService.uploadImage).toHaveBeenCalled();
    });

    it('should throw an exception if a library already exists within 20 meters', async () => {
      prisma.library.findMany.mockResolvedValue([
        {
          id: 'existing-library-id',
          creatorId: 2,
          lat: new Prisma.Decimal(52.52002),
          lng: new Prisma.Decimal(13.40502),
        },
      ]);

      await expect(
        libraryService.create({
          library: mockLibraryDto,
          user: mockUser,
          image: null,
        }),
      ).rejects.toThrow('Library already exists');

      expect(prisma.library.findMany).toHaveBeenCalled();
    });

    it('should throw an exception if OpenAI fails to create a library description', async () => {
      prisma.library.findMany.mockResolvedValue([]);

      (
        openAiClientService.createLibraryDescription as jest.Mock
      ).mockRejectedValue(new Error('OpenAI Error'));

      await expect(
        libraryService.create({
          library: mockLibraryDto,
          user: mockUser,
          image: null,
        }),
      ).rejects.toThrow('OpenAI Error');

      expect(prisma.library.findMany).toHaveBeenCalled();
      expect(openAiClientService.createLibraryDescription).toHaveBeenCalled();
    });

    it('should handle missing address components gracefully', async () => {
      prisma.library.findMany.mockResolvedValue([]);

      (
        openAiClientService.createLibraryDescription as jest.Mock
      ).mockResolvedValue('Mocked description');

      (geocodingService.getAddressComponents as jest.Mock).mockResolvedValue(
        null,
      );

      (imageUploadService.uploadImage as jest.Mock).mockResolvedValue(
        'http://mocked-image-url.com',
      );

      prisma.library.create.mockResolvedValue({
        id: 'new-library-id',
        lat: new Prisma.Decimal(mockLibraryDto.lat),
        lng: new Prisma.Decimal(mockLibraryDto.lng),
        creatorId: mockUser.id,
      });

      const result = await libraryService.create({
        library: mockLibraryDto,
        user: mockUser,
        image: null,
      });

      expect(result).toBeDefined();
      expect(result.id).toEqual('new-library-id');
    });
  });

  describe('findNearby', () => {
    it('should return libraries within the specified radius', async () => {
      prisma.library.findMany.mockResolvedValue([
        {
          id: 'library1',
          lat: new Prisma.Decimal(52.52),
          lng: new Prisma.Decimal(13.405),
          creatorId: 1,
          LibraryContent: [
            {
              status: 'approved',
              description: 'A nearby library',
              imageUrl: 'http://image1.com',
              street: '456 Distant St',
              city: 'Distant City',
              state: 'Distant State',
              zip: '45678',
              createdAt: new Date(),
              updatedAt: new Date(),
              authorId: 1,
            },
          ],
        } as Library,
      ]);

      const result = await libraryService.findNearby({
        lat: 52.52,
        lng: 13.405,
        radiusInMiles: 30,
      });

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'library1',
          description: 'A nearby library',
          distanceInMiles: expect.any(Number),
        }),
      );
      expect(prisma.library.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            lat: {
              gte: expect.any(Number),
              lte: expect.any(Number),
            },
            lng: {
              gte: expect.any(Number),
              lte: expect.any(Number),
            },
          },
          include: {
            LibraryContent: expect.any(Object),
          },
        }),
      );
    });

    it('should exclude libraries outside the radius', async () => {
      prisma.library.findMany.mockResolvedValue([
        {
          id: 'library1',
          lat: new Prisma.Decimal(53.0),
          lng: new Prisma.Decimal(14.0),
          creatorId: 1,
          LibraryContent: [
            {
              status: 'approved',
              description: 'An out-of-radius library',
              imageUrl: 'http://image1.com',
              street: '456 Distant St',
              city: 'Distant City',
              state: 'Distant State',
              zip: '45678',
              createdAt: new Date(),
              updatedAt: new Date(),
              authorId: 1,
            },
          ],
        } as Library,
      ]);

      const result = await libraryService.findNearby({
        lat: 52.52,
        lng: 13.405,
        radiusInMiles: 30,
      });

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });

    it('should handle no libraries found gracefully', async () => {
      prisma.library.findMany.mockResolvedValue([]);

      const result = await libraryService.findNearby({
        lat: 52.52,
        lng: 13.405,
        radiusInMiles: 30,
      });

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });

    it('should throw an error if Prisma query fails', async () => {
      prisma.library.findMany.mockRejectedValue(new Error('Prisma error'));

      await expect(
        libraryService.findNearby({
          lat: 52.52,
          lng: 13.405,
          radiusInMiles: 30,
        }),
      ).rejects.toThrow('Prisma error');
    });
  });
});
