import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AddressComponents } from '../geocoding/geocoding.service';

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
  ): Promise<string> {
    const name = `${address.city}-${address.state}-${address.zip}-${Date.now()}`;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: name,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${name}`;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to upload image',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
