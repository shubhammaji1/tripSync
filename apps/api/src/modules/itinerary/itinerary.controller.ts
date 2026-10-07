import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ItineraryService } from './itinerary.service';
import { RolesGuard } from '../../common/roles.guard';
import { RequireRoles } from '../../common/roles.decorator';
import { TripRole } from '@tripsync/types';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  createActivitySchema,
  createTripDaySchema,
  CreateTripDayInput,
  updateActivitySchema,
  CreateActivityInput,
  UpdateActivityInput,
} from '@tripsync/validation';

@ApiTags('Itinerary')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles(TripRole.VIEWER)
@Controller('trips/:tripId/itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all itinerary days and activities for a trip' })
  async getItinerary(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.itineraryService.getItinerary(tripId, userId);
  }

  @Post('days')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Create a custom itinerary day' })
  async createDay(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTripDaySchema)) body: CreateTripDayInput
  ) {
    return this.itineraryService.createDay(tripId, userId, body);
  }

  @Post('activities')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Add a new activity to a trip day' })
  async createActivity(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createActivitySchema)) body: CreateActivityInput
  ) {
    return this.itineraryService.createActivity(tripId, userId, body);
  }

  @Delete('days/:dayId')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Delete an itinerary day and its activities' })
  async deleteDay(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.itineraryService.deleteDay(tripId, dayId, userId);
  }

  @Patch('activities/:activityId')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Update an existing activity' })
  async updateActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateActivitySchema)) body: UpdateActivityInput
  ) {
    return this.itineraryService.updateActivity(tripId, activityId, userId, body);
  }

  @Delete('activities/:activityId')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Delete an activity' })
  async deleteActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.itineraryService.deleteActivity(tripId, activityId, userId);
  }
}
