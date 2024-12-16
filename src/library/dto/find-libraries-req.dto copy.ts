import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindLibrariesReqDto {
  @IsNotEmpty()
  @IsNumber()
  @Max(90)
  @Min(-90)
  @Transform(({ value }) => parseFloat(value))
  lat: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(180)
  @Min(-180)
  @Transform(({ value }) => parseFloat(value))
  lng: number;
}
