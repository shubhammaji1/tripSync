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
import { TripsService } from './trips.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  createTripSchema,
  updateTripSchema,
  CreateTripInput,
  UpdateTripInput,
} from '@tripsync/validation';
import { Profile } from '@tripsync/types';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOperation({ summary: 'List all trips for the authenticated user' })
  async getAllTrips(@CurrentUser('id') userId: string) {
    return this.tripsService.getAllTrips(userId);
  }

  @Get(':tripId')
  @ApiOperation({ summary: 'Get details for a specific trip' })
  async getTripById(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.tripsService.getTripById(tripId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  async createTrip(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTripSchema)) body: CreateTripInput
  ) {
    return this.tripsService.createTrip(userId, body);
  }

  @Patch(':tripId')
  @ApiOperation({ summary: 'Update trip details (Owner or Admin)' })
  async updateTrip(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateTripSchema)) body: UpdateTripInput
  ) {
    return this.tripsService.updateTrip(tripId, userId, body);
  }

  @Delete(':tripId')
  @ApiOperation({ summary: 'Delete or archive a trip (Owner only)' })
  async deleteTrip(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.tripsService.deleteTrip(tripId, userId);
  }
}
