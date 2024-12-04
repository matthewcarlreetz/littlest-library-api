import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { PrismaModule } from 'utils/prisma/prisma.module';
import { OpenAIModule } from 'utils/openAiClient/openAiClient.module';
import { GeocodingModule } from 'utils/geocoding/geocoding.module';
import { ImageUploadModule } from 'utils/imageUpload/imageUpload.module';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService, PrismaModule],
  imports: [PrismaModule, OpenAIModule, GeocodingModule, ImageUploadModule],
})
export class LibraryModule {}
