import { IsNotEmpty, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLibraryDto {
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  lat: number;

  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  lng: number;

  // TODO: add validation for tags
  tags: string;
}
