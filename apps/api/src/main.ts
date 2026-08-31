import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables early before bootstrap checks
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
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
    new FastifyAdapter({ logger: true })
  );

  // Performance: Response compression (Brotli / Gzip) for slow mobile connections
  await app.register(compress as any, {
    encodings: ['gzip', 'deflate', 'br'],
  });

  // Security: HTTP Security Headers via Helmet
  await app.register(helmet as any, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  // Security: Rate Limiting & Abuse Protection (120 req/min per IP)
  await app.register(rateLimit as any, {
    max: 120,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost'],
    errorResponseBuilder: (req: any, context: any) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.round(context.ttl / 1000)} seconds.`,
      retryAfter: Math.round(context.ttl / 1000),
    }),
  });

  // Security: Global Input Sanitization & Payload Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
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

  // Self-check: hit our own health endpoint over loopback right after boot.
  // This proves (or disproves) that the process can actually accept and
  // answer HTTP requests on the bound port, without needing shell/curl
  // access to the container - the result is visible in the normal deploy
  // log, which is available on every Render plan including free.
  try {
    const http = await import('http');
    await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${port}/api/v1/health`, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          logger.log(`✅ Self health-check responded: ${res.statusCode} ${body}`);
          resolve(null);
        });
      });
      req.on('error', (err) => {
        logger.error(`❌ Self health-check request failed: ${err.message}`);
        reject(err);
      });
      req.setTimeout(5000, () => {
        logger.error('❌ Self health-check timed out after 5s - the process is not answering its own port');
        req.destroy();
        reject(new Error('self health-check timeout'));
      });
    });
  } catch {
    // already logged above
  }
}

bootstrap();