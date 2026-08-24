import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('TripSyncBootstrap');

  // Authentication has no fallback path anymore (see AuthGuard) - every
  // request needs a verifiable Supabase session token. If this secret is
  // missing in production, every request will correctly 401, but that's a
  // silent, confusing failure mode in prod - fail loudly at boot instead.
  if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_JWT_SECRET) {
    throw new Error(
      'SUPABASE_JWT_SECRET is required in production - the API cannot verify user sessions without it.',
    );
  }
  if (!process.env.SUPABASE_JWT_SECRET) {
    logger.warn(
      'SUPABASE_JWT_SECRET is not set - all authenticated requests will be rejected until it is configured.',
    );
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS - explicit allow-list, not '*'. '*' combined with
  // credentials:true is meaningless to browsers anyway, and defeats the
  // point of bearer-token auth being scoped to our own frontend origins.
  const allowedOrigins = (process.env.WEB_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
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
