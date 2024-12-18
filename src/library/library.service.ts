import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLibraryDto } from './dto/create-library.dto';
import { PrismaService } from 'utils/prisma/prisma.service';
import { Library } from './entities/library.entity';
import { User } from '@prisma/client';
import haversineDistance from 'utils/haversineDistance';
import { OpenAIClientService } from 'utils/openAiClient/openAiClient.service';
import { GeocodingService } from 'utils/geocoding/geocoding.service';
import { ImageUploadService } from 'utils/imageUpload/imageUpload.service';
import { FindLibrariesResDto } from './dto/find-libraries-res.dto';

@Injectable()
export class LibraryService {
  constructor(
    private prisma: PrismaService,
    private openAiClient: OpenAIClientService,
    private geocoder: GeocodingService,
    private imageUpload: ImageUploadService,
  ) {}

  async create({
    library,
    user,
    image,
  }: {
    library: CreateLibraryDto;
    user: User;
    image?: Express.Multer.File;
  }): Promise<Library> {
    // TODO: Rate limit a user to X libraries per day
    const geoOffset = 0.00002; // A crude lat/lng offset to check for duplicates. At the equator, this is about 73 feet.

    const existingLibraries = await this.prisma.library.findMany({
      where: {
        lat: {
          gte: library.lat - geoOffset,
          lte: library.lat + geoOffset,
        },
        lng: {
          gte: library.lng - geoOffset,
          lte: library.lng + geoOffset,
        },
      },
    });

    const isDuplicate = existingLibraries.find((existingLibrary) => {
      const distanceInFt = haversineDistance(existingLibrary, library);
      return distanceInFt < 20;
    });

    if (isDuplicate) {
      throw new HttpException('Library already exists', HttpStatus.CONFLICT);
    }

    const description = await this.openAiClient.createLibraryDescription({
      image,
      tags: library.tags,
    });

    const addressComponents = await this.geocoder.getAddressComponents({
      lat: library.lat,
      lng: library.lng,
    });

    const imageUrl = await this.imageUpload.uploadImage(
      image,
      addressComponents,
    );

    const createdLibrary = await this.prisma.library.create({
      data: {
        lat: library.lat,
        lng: library.lng,
        creatorId: user.id,
      },
    });

    await this.prisma.libraryContent.create({
      data: {
        libraryId: createdLibrary.id,
        description,
        imageUrl,
        street: addressComponents?.street,
        state: addressComponents?.state,
        city: addressComponents?.city,
        zip: addressComponents?.zip,
        authorId: user.id,
      },
    });

    return createdLibrary;
  }

  async findNearby({
    lat,
    lng,
    radiusInMiles = 30,
  }: {
    lat: number;
    lng: number;
    radiusInMiles?: number;
  }): Promise<FindLibrariesResDto[]> {
    const latOffset = radiusInMiles / 69;
    const lngOffset = radiusInMiles / (69 * Math.cos(lat * (Math.PI / 180)));

    const libraries = await this.prisma.library.findMany({
      where: {
        lat: {
          gte: lat - latOffset,
          lte: lat + latOffset,
        },
        lng: {
          gte: lng - lngOffset,
          lte: lng + lngOffset,
        },
      },
      include: {
        LibraryContent: {
          where: {
            status: { not: 'rejected' },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    return libraries.flatMap((library) => {
      const { LibraryContent: libContent, ...rest } = library;
      if (!libContent.length) return [];

      const distanceInFt = haversineDistance(library, { lat, lng });
      const distanceInMiles = distanceInFt / 5280;

      if (distanceInMiles > radiusInMiles) return [];

      return [
        {
          distanceInMiles,
          ...libContent[0],
          ...rest,
        },
      ];
    });
  }
}
