import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrailWatchService } from './trailwatch.service';
import { RolesGuard } from '../../common/roles.guard';
import { RequireRoles } from '../../common/roles.decorator';
import { TripRole } from '@tripsync/types';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  createTrailReportSchema,
  createTripRouteSchema,
  CreateTrailReportInput,
  CreateTripRouteInput,
} from '@tripsync/validation';
import { Profile } from '@tripsync/types';

@ApiTags('TrailWatch')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles(TripRole.VIEWER)
@Controller('trips/:tripId/trailwatch')
export class TrailWatchController {
  constructor(private readonly trailwatchService: TrailWatchService) {}

  @Get()
  @ApiOperation({ summary: 'Get consolidated TrailWatch intelligence overview for a trip' })
  async getOverview(@Param('tripId') tripId: string) {
    return this.trailwatchService.getOverview(tripId);
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get monitored travel routes and segments for a trip' })
  async getRoutes(@Param('tripId') tripId: string) {
    return this.trailwatchService.getRoutes(tripId);
  }

  @Post('routes')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Add a new monitored route to the trip' })
  async createRoute(
    @Param('tripId') tripId: string,
    @Body(new ZodValidationPipe(createTripRouteSchema)) body: CreateTripRouteInput
  ) {
    return this.trailwatchService.createRoute(tripId, body);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get active TrailWatch alerts for a trip' })
  async getAlerts(@Param('tripId') tripId: string) {
    return this.trailwatchService.getAlerts(tripId);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get community trail condition reports for a trip' })
  async getReports(@Param('tripId') tripId: string) {
    return this.trailwatchService.getReports(tripId);
  }

  @Post('reports')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Submit a new community condition/incident report' })
  async createReport(
    @Param('tripId') tripId: string,
    @CurrentUser() user: Profile,
    @Body(new ZodValidationPipe(createTrailReportSchema)) body: CreateTrailReportInput
  ) {
    return this.trailwatchService.createReport(tripId, user.id, body);
  }

  @Post('alerts/:alertId/acknowledge')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Acknowledge an active condition alert' })
  async acknowledgeAlert(
    @Param('tripId') tripId: string,
    @Param('alertId') alertId: string,
    @CurrentUser() user: Profile
  ) {
    return this.trailwatchService.acknowledgeAlert(tripId, alertId, user.id);
  }
}
