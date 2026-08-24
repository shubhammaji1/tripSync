import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe for hosting platforms (Render, Railway, etc.)' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}