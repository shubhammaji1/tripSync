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
import { AuthGuard } from '../../common/auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  createActivitySchema,
  updateActivitySchema,
  CreateActivityInput,
  UpdateActivityInput,
} from '@tripsync/validation';

@ApiTags('Itinerary')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('trips/:tripId/itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all itinerary days and activities for a trip' })
  async getItinerary(@Param('tripId') tripId: string) {
    return this.itineraryService.getItinerary(tripId);
  }

  @Post('activities')
  @ApiOperation({ summary: 'Add a new activity to a trip day' })
  async createActivity(
    @Param('tripId') tripId: string,
    @Body(new ZodValidationPipe(createActivitySchema)) body: CreateActivityInput
  ) {
    return this.itineraryService.createActivity(tripId, body);
  }

  @Patch('activities/:activityId')
  @ApiOperation({ summary: 'Update an existing activity' })
  async updateActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Body(new ZodValidationPipe(updateActivitySchema)) body: UpdateActivityInput
  ) {
    return this.itineraryService.updateActivity(activityId, body);
  }

  @Delete('activities/:activityId')
  @ApiOperation({ summary: 'Delete an activity' })
  async deleteActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string
  ) {
    return this.itineraryService.deleteActivity(activityId);
  }
}
