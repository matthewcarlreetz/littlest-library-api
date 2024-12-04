import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { LibraryModule } from '../library/library.module';
import { OpenAIModule } from 'utils/openAiClient/openAiClient.module';
import { GeocodingModule } from 'utils/geocoding/geocoding.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    LibraryModule,
    OpenAIModule,
    GeocodingModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info', // Set the log level, e.g., info, debug, error, etc.
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true, // Enable colorization for logs in development mode
                },
              }
            : undefined,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    JwtStrategy,
  ],
})
export class AppModule {}
