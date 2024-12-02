import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenAIModule } from '../app/openAiClient/openAiClient.module';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService, PrismaModule],
  imports: [PrismaModule, OpenAIModule],
})
export class LibraryModule {}
