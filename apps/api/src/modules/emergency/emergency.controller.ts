import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { AuthGuard } from '../../common/auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  createEmergencyContactSchema,
  CreateEmergencyContactInput,
} from '@tripsync/validation';

@ApiTags('Emergency')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('trips/:tripId/emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Get('contacts')
  @ApiOperation({ summary: 'Get all emergency contacts for a trip' })
  async getEmergencyContacts(@Param('tripId') tripId: string) {
    return this.emergencyService.getEmergencyContacts(tripId);
  }

  @Get('packet')
  @ApiOperation({ summary: 'Get lightweight offline-ready emergency data packet' })
  async getEmergencyPacket(@Param('tripId') tripId: string) {
    return this.emergencyService.getEmergencyPacket(tripId);
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Add a new emergency contact' })
  async createEmergencyContact(
    @Param('tripId') tripId: string,
    @Body(new ZodValidationPipe(createEmergencyContactSchema)) body: CreateEmergencyContactInput
  ) {
    return this.emergencyService.createEmergencyContact(tripId, body);
  }
}
