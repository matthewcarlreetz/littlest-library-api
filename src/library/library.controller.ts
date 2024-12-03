import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '../auth/decorators/user.decorator';

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
}
