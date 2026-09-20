import { config } from 'dotenv';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Look for .env in the project directory instead of the parent folder
config({ path: join(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS updated to allow your live .np domain
  app.enableCors({ 
    origin: [
      'http://localhost:5173', 
      'http://localhost:5174',
      'https://nailinspo.com.np', 
      'https://nailinspo.com.np'
    ],
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
