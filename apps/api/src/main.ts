import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config(); // Loads .env from current directory (apps/api)
dotenv.config({ path: path.join(process.cwd(), '../../.env') }); // Loads .env from root
console.log('DATABASE_URL:', process.env.DATABASE_URL);
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors();

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //  🌐 Secure CORS
  app.enableCors({
    origin: ['http://localhost:3000'], // frontend URL
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });


  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Local Service Marketplace API')
    .setDescription('The core API for connecting urban households with skilled service providers.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server is running on: http://localhost:${port}/v1`);
  console.log(`📝 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
