import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, baseUrl } = request;

    // TODO: Apply only to dev
    const send = response.send;
    response.send = (body) => {
      this.logger.log({
        body,
        baseUrl,
        method,
        statusCode: response.statusCode,
      });
      response.send = send;
      return response.send(body);
    };

    next();
  }
}
