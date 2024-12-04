import { Test, TestingModule } from '@nestjs/testing';
import { ImageUploadService } from './imageUpload.service';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AddressComponents } from 'utils/geocoding/geocoding.service';

jest.mock('@aws-sdk/client-s3');

describe('ImageUploadService', () => {
  let imageUploadService: ImageUploadService;
  const mockS3Client = {
    send: jest.fn(),
  };

  const mockAccessKeyId = 'mock-access-key-id';
  const mockSecretAccessKey = 'mock-secret-access-key';
  const mockRegion = 'mock-region';
  const mockBucketName = 'mock-bucket-name';

  beforeEach(async () => {
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageUploadService,
        { provide: 'AWS_ACCESS_KEY_ID', useValue: mockAccessKeyId },
        { provide: 'AWS_SECRET_ACCESS_KEY', useValue: mockSecretAccessKey },
        { provide: 'AWS_REGION', useValue: mockRegion },
        { provide: 'BUCKET_NAME', useValue: mockBucketName },
      ],
    }).compile();

    imageUploadService = module.get<ImageUploadService>(ImageUploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(imageUploadService).toBeDefined();
  });

  describe('uploadImage', () => {
    const mockFile: Express.Multer.File = {
      buffer: Buffer.from('mock-file-content'),
      mimetype: 'image/jpeg',
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      size: 12345,
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    const mockAddress: AddressComponents = {
      street: '123 Mock St',
      city: 'MockCity',
      state: 'MockState',
      zip: '12345',
    };

    it('should return the uploaded file URL on successful upload', async () => {
      mockS3Client.send.mockResolvedValueOnce({});

      const result = await imageUploadService.uploadImage(
        mockFile,
        mockAddress,
      );

      expect(result).toContain(
        `https://${mockBucketName}.s3.${mockRegion}.amazonaws.com`,
      );
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand),
      );
    });
  });
});
