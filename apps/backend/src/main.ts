import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { ConfigService } from './core/config/config.service';
import { LoggerService } from './core/logger/logger.service';
import { AllExceptionsFilter } from './core/error/all-exceptions.filter';
import { ApiResponseInterceptor } from './core/error/api-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Enable Security Headers via Helmet
  app.use(helmet());

  // Enable Response Compression
  app.use(compression());

  // Enable CORS
  app.enableCors({
    origin: config.app.corsOrigin,
    credentials: true,
  });

  // Global API Prefix & URI Versioning
  app.setGlobalPrefix(config.app.apiPrefix);

  // Global Exception Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable Graceful Shutdown Signal Listeners
  app.enableShutdownHooks();

  // Configure Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(config.app.appName)
    .setDescription('Enterprise API Documentation for Government Policy Intelligence Platform')
    .setVersion(config.app.appVersion)
    .addBearerAuth()
    .addTag('Health & Monitoring', 'Platform operational health and probes')
    .addTag('Policy', 'Policy ingestion and analysis scaffolding')
    .addTag('Citizen', 'Citizen eligibility scaffolding')
    .addTag('AI Copilot', 'AI intelligence copilot scaffolding')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.app.port;
  await app.listen(port);
  logger.log(`GPIOS Backend Service successfully launched on port ${port}`);
  logger.log(`Swagger OpenAPI Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
