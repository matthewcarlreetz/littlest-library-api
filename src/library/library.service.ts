import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Library } from './entities/library.entity';
import { User } from '@prisma/client';
import haversineDistance from '../app/utils/haversineDistance';
import { OpenAIClientService } from '../app/openAiClient/openAiClient.service';

@Injectable()
export class LibraryService {
  constructor(
    private prisma: PrismaService,
    private openAiClient: OpenAIClientService,
  ) {}

  async findOne(id: string): Promise<Library | null> {
    return this.prisma.library.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Library[]> {
    return this.prisma.library.findMany();
  }

  async update(params: {
    id: string;
    data: UpdateLibraryDto;
  }): Promise<Library> {
    const { data, id } = params;
    return this.prisma.library.update({
      data,
      where: { id },
    });
  }

  async remove(id: string): Promise<Library> {
    return this.prisma.library.delete({
      where: { id },
    });
  }

  async create({
    library,
    user,
    image,
  }: {
    library: CreateLibraryDto;
    user: User;
    image?: Express.Multer.File;
  }): Promise<Library> {
    // TODO:
    // Rate limit a user to X libraries per day
    // Verify this location doesn't already exist ✔️
    // Check with OpenAi api that the image contains a library and nothing inappropriate, generate a description ✔
    // Lookup street address
    // Save image to s3
    // Add to db

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
      const distance = haversineDistance(existingLibrary, library);
      return distance < 20;
    });

    if (isDuplicate) {
      throw new HttpException('Library already exists', HttpStatus.CONFLICT);
    }

    const description = await this.openAiClient.createLibraryDescription({
      image,
      tags: library.tags,
    });

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
        title: '',
        description,
        imageUrl: '',
        street: '',
        state: '',
        zip: '',
        authorId: user.id,
      },
    });

    return createdLibrary;
  }
}
