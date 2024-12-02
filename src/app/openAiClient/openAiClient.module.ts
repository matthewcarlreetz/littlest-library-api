import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAIClientService } from './openAiClient.service';

@Module({
  imports: [ConfigModule],
  providers: [
    OpenAIClientService,
    {
      provide: 'OPENAI_API_KEY',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('OPENAI_API_KEY'),
      inject: [ConfigService],
    },
  ],
  exports: [OpenAIClientService],
})
export class OpenAIModule {}
