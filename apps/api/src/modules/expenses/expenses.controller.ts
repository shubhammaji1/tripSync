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
import { ExpensesService } from './expenses.service';
import { RolesGuard } from '../../common/roles.guard';
import { RequireRoles } from '../../common/roles.decorator';
import { TripRole } from '@tripsync/types';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { createExpenseSchema, updateExpenseSchema, CreateExpenseInput, UpdateExpenseInput } from '@tripsync/validation';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles(TripRole.VIEWER)
@Controller('trips/:tripId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all expenses for a trip' })
  async getTripExpenses(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.expensesService.getTripExpenses(tripId, userId);
  }

  @Post()
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Add a new expense with split allocations' })
  async createExpense(
    @Param('tripId') tripId: string,
    @CurrentUser('id') paidById: string,
    @Body(new ZodValidationPipe(createExpenseSchema)) body: CreateExpenseInput
  ) {
    return this.expensesService.createExpense(tripId, paidById, body);
  }

  @Delete(':expenseId')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Delete an expense record' })
  async deleteExpense(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.expensesService.deleteExpense(tripId, expenseId, userId);
  }

  @Patch(':expenseId')
  @RequireRoles(TripRole.MEMBER)
  @ApiOperation({ summary: 'Update an expense record' })
  async updateExpense(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateExpenseSchema)) body: UpdateExpenseInput
  ) {
    return this.expensesService.updateExpense(tripId, expenseId, userId, body);
  }
}
