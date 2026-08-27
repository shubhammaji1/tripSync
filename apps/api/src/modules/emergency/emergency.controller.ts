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
import { EmergencyService } from './emergency.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from '@tripsync/validation';
import { Profile } from '@tripsync/types';

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
  @ApiOperation({ summary: 'Add a new emergency contact (Owner / Admin)' })
  async createEmergencyContact(
    @Param('tripId') tripId: string,
    @CurrentUser() user: Profile,
    @Body(new ZodValidationPipe(createEmergencyContactSchema)) body: CreateEmergencyContactInput
  ) {
    return this.emergencyService.createEmergencyContact(tripId, user?.id, body);
  }

  @Patch('contacts/:contactId')
  @ApiOperation({ summary: 'Update an existing emergency contact (Owner / Admin)' })
  async updateEmergencyContact(
    @Param('tripId') tripId: string,
    @Param('contactId') contactId: string,
    @CurrentUser() user: Profile,
    @Body(new ZodValidationPipe(updateEmergencyContactSchema)) body: UpdateEmergencyContactInput
  ) {
    return this.emergencyService.updateEmergencyContact(tripId, contactId, user?.id, body);
  }

  @Delete('contacts/:contactId')
  @ApiOperation({ summary: 'Delete an emergency contact (Owner / Admin)' })
  async deleteEmergencyContact(
    @Param('tripId') tripId: string,
    @Param('contactId') contactId: string,
    @CurrentUser() user: Profile
  ) {
    return this.emergencyService.deleteEmergencyContact(tripId, contactId, user?.id);
  }

  @Post('seed-starter')
  @ApiOperation({ summary: 'Seed quick starter emergency contacts for a trip (Owner / Admin)' })
  async seedStarterContacts(
    @Param('tripId') tripId: string,
    @CurrentUser() user: Profile
  ) {
    return this.emergencyService.seedDefaultContacts(tripId, user?.id);
  }
}
