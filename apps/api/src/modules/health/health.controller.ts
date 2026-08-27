import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

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
  @Get()
  @ApiOperation({ summary: 'Liveness probe for hosting platforms (Render, Railway, etc.)' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}