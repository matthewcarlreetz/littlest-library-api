import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageUploadService } from './imageUpload.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ImageUploadService,
    {
      provide: 'AWS_ACCESS_KEY_ID',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('AWS_ACCESS_KEY_ID'),
      inject: [ConfigService],
    },
    {
      provide: 'AWS_SECRET_ACCESS_KEY',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      inject: [ConfigService],
    },
    {
      provide: 'AWS_REGION',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('AWS_REGION'),
      inject: [ConfigService],
    },
    {
      provide: 'BUCKET_NAME',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('BUCKET_NAME'),
      inject: [ConfigService],
    },
  ],
  exports: [ImageUploadService],
})
export class ImageUploadModule {}
