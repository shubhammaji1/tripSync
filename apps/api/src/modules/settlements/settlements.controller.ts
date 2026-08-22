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
import { AuthGuard } from '../../common/auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { createSettlementSchema, CreateSettlementInput } from '@tripsync/validation';

@ApiTags('Settlements')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('trips/:tripId/settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get balances and optimized debt settlement transfers for a trip' })
  async getTripSettlements(@Param('tripId') tripId: string) {
    return this.settlementsService.getTripSettlements(tripId);
  }

  @Post()
  @ApiOperation({ summary: 'Record or mark a settlement transfer as completed' })
  async recordSettlement(
    @Param('tripId') tripId: string,
    @Body(new ZodValidationPipe(createSettlementSchema)) body: CreateSettlementInput
  ) {
    return this.settlementsService.recordSettlement(tripId, body);
  }
}
