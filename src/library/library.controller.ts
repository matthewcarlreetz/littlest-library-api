import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Get,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '../auth/decorators/user.decorator';
import { FindLibrariesResDto } from './dto/find-libraries-res.dto';
import { FindLibrariesReqDto } from './dto/find-libraries-req.dto copy';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createLibraryDto: CreateLibraryDto,
    @UploadedFile() image: Express.Multer.File,
    @User() user,
  ) {
    if (!image) {
      throw new HttpException('An image is required', HttpStatus.BAD_REQUEST);
    }

    return this.libraryService.create({
      library: createLibraryDto,
      user,
      image,
    });
  }

  @Get()
  findNearby(
    @Query(
      new ValidationPipe({
        transform: true,
      }),
    )
    query: FindLibrariesReqDto,
  ): Promise<FindLibrariesResDto[]> {
    return this.libraryService.findNearby(query);
  }
}
