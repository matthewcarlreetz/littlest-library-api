import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenAIModule } from '../openAiClient/openAiClient.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { ImageUploadModule } from '../imageUpload/imageUpload.module';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService, PrismaModule],
  imports: [PrismaModule, OpenAIModule, GeocodingModule, ImageUploadModule],
})
export class LibraryModule {}
