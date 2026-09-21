import { config } from 'dotenv';
import { join } from 'node:path';
import dns from 'node:dns';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
dns.setDefaultResultOrder('ipv4first');
// Look for .env in the project directory instead of the parent folder
config({ path: join(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nail Inspo Booking API')
    .setDescription('Request and check nail studio appointments.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  // Added '0.0.0.0' so Render can route public traffic to your app
  await app.listen(process.env.PORT ?? 5000, '0.0.0.0');
}

bootstrap();
