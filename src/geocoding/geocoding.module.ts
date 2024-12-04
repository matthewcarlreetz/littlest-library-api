import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [ConfigModule],
  providers: [
    GeocodingService,
    {
      provide: 'MAPBOX_API_KEY',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('MAPBOX_API_KEY'),
      inject: [ConfigService],
    },
  ],
  exports: [GeocodingService],
})
export class GeocodingModule {}
