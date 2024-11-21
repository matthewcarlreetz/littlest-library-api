import { Injectable } from '@nestjs/common';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Library } from './entities/library.entity';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

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

  create(data: CreateLibraryDto): Promise<Library> {
    return this.prisma.library.create({
      data,
    });
  }
}
