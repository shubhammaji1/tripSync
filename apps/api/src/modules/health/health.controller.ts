import { Controller, Get, Inject, Optional, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { sql } from 'drizzle-orm';

@ApiTags('Root')
@Controller()
export class RootController {
  @Get()
  @ApiOperation({ summary: 'API Root status' })
  getRoot() {
    return {
      name: 'TripSync REST API',
      status: 'online',
      version: '1.0',
      docs: '/api/docs',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    };
  }
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Optional() @Inject(DRIZZLE_PROVIDER) private readonly db?: DrizzleDB) {}

  @Get('live')
  live() { return { status: 'ok' }; }

  @Get()
  @ApiOperation({ summary: 'Liveness and database keep-alive probe (Render + Supabase)' })
  async check() {
    let dbStatus = 'skipped';
    if (this.db) {
      try {
        await this.db.execute(sql`SELECT 1`);
        dbStatus = 'connected';
      } catch (err: any) {
        throw new ServiceUnavailableException('Database unavailable');
      }
    }

    if (!this.db) throw new ServiceUnavailableException('Database unavailable');
    return {
      status: 'ok',
      service: 'TripSync API (Render)',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
