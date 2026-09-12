import { Logger } from '@nestjs/common';

export abstract class BaseController {
  protected readonly logger: Logger;

  constructor(controllerName: string) {
    this.logger = new Logger(controllerName);
  }
}
