import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { RolesGuard } from '../../common/roles.guard';
import { RequireRoles } from '../../common/roles.decorator';
import { TripRole } from '@tripsync/types';
import { AuthGuard } from '../../common/auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { createSettlementSchema, CreateSettlementInput } from '@tripsync/validation';

import { CurrentUser } from '../../common/current-user.decorator';

@ApiTags('Settlements')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles(TripRole.VIEWER)
@Controller('trips/:tripId/settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get balances and optimized debt settlement transfers for a trip' })
  async getTripSettlements(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.settlementsService.getTripSettlements(tripId, userId);
  }

  @Post()
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Record or mark a settlement transfer as completed' })
  async recordSettlement(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createSettlementSchema)) body: CreateSettlementInput
  ) {
    return this.settlementsService.recordSettlement(tripId, userId, body);
  }
}
