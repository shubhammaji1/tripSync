import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('TripSyncBootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('TripSync REST API')
    .setDescription('Collaborative Group Travel Platform — API Specification')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Trips', 'Trip creation, management, and settings')
    .addTag('Members', 'Trip invitations, membership, and RBAC roles')
    .addTag('Itinerary', 'Day-by-day itinerary and activity scheduling')
    .addTag('Expenses', 'Expense logging, multi-way splits, and receipts')
    .addTag('Settlements', 'Optimal debt settlement and cash-flow minimization')
    .addTag('Tasks', 'Task assignments, priorities, and checklist')
    .addTag('Emergency', 'Critical emergency contacts and offline packet')
    .addTag('Analytics', 'Spending aggregations, budget tracking, and velocity')
    .addTag('Auth & Profiles', 'User profiles and authentication')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 TripSync API is running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Documentation is available on http://localhost:${port}/api/docs`);
}

bootstrap();
