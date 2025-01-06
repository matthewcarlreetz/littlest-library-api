import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AddressComponents } from 'utils/geocoding/geocoding.service';
import sharp from 'sharp';

@Injectable()
export class ImageUploadService {
  private readonly bucketName: string;
  private readonly region: string;
  private s3Client: S3Client;

  constructor(
    @Inject('AWS_ACCESS_KEY_ID') accessKeyId: string,
    @Inject('AWS_SECRET_ACCESS_KEY') secretAccessKey: string,
    @Inject('AWS_REGION') region: string,
    @Inject('BUCKET_NAME') bucketName: string,
  ) {
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = bucketName;
    this.region = region;
  }
  async uploadImage(
    file: Express.Multer.File,
    address: AddressComponents,
  ): Promise<{ original: string; thumbnail: string }> {
    const timestamp = Date.now();
    const baseName = `${address.city}-${address.state}-${address.zip}-${timestamp}`;
    const thumbnailName = `${baseName}-thumbnail`;

    try {
      // Upload original image
      const originalCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: baseName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      // Create and upload thumbnail
      const thumbnailBuffer = await this.createThumbnail(file.buffer);
      const thumbnailCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: thumbnailName,
        Body: thumbnailBuffer,
        ContentType: file.mimetype,
      });

      await Promise.all([
        this.s3Client.send(originalCommand),
        this.s3Client.send(thumbnailCommand),
      ]);

      return {
        original: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${baseName}`,
        thumbnail: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${thumbnailName}`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to upload image',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();
  }
}
