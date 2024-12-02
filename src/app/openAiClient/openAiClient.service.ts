import OpenAI from 'openai';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class OpenAIClientService {
  private openai: OpenAI;

  constructor(@Inject('OPENAI_API_KEY') apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async createLibraryDescription({
    image,
    tags,
  }: {
    image: Express.Multer.File;
    tags: string;
  }): Promise<any> {
    const base64Image = image.buffer.toString('base64');

    try {
      const prompt = `Does this image contain a little free library and is there no inappropriate content?
       If not, respond with "no", otherwise respond with a brief description of the image given this
       additional information: ${tags}. The full response will be used to show to an end user.
       The response should begin with "This little free library is...". Do not say anything about whether
       there is inappropriate content in the image. Just create a user facing description of the library.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      });

      const content = response.choices[0].message.content;
      if (content.toLowerCase().includes('no')) {
        throw new HttpException(
          'This image is invalid. Please try again with a different image.',
          HttpStatus.BAD_REQUEST,
        );
      }

      return content;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      throw new HttpException(
        'Cannot analyze image right now. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
        { cause: e },
      );
    }
  }
}
