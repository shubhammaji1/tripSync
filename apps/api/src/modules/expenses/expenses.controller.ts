import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { createExpenseSchema, CreateExpenseInput } from '@tripsync/validation';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('trips/:tripId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all expenses for a trip' })
  async getTripExpenses(@Param('tripId') tripId: string) {
    return this.expensesService.getTripExpenses(tripId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new expense with split allocations' })
  async createExpense(
    @Param('tripId') tripId: string,
    @CurrentUser('id') paidById: string,
    @Body(new ZodValidationPipe(createExpenseSchema)) body: CreateExpenseInput
  ) {
    return this.expensesService.createExpense(tripId, paidById, body);
  }

  @Delete(':expenseId')
  @ApiOperation({ summary: 'Delete an expense record' })
  async deleteExpense(@Param('expenseId') expenseId: string) {
    return this.expensesService.deleteExpense(expenseId);
  }
}
