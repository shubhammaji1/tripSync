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
import { TasksService } from './tasks.service';
import { AuthGuard } from '../../common/auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  createTaskSchema,
  updateTaskSchema,
  CreateTaskInput,
  UpdateTaskInput,
} from '@tripsync/validation';

import { CurrentUser } from '../../common/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('trips/:tripId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks for a trip' })
  async getTripTasks(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.tasksService.getTripTasks(tripId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task with assignee and due date' })
  async createTask(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: CreateTaskInput
  ) {
    return this.tasksService.createTask(tripId, userId, body);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update task details or change status' })
  async updateTask(
    @Param('tripId') tripId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: UpdateTaskInput
  ) {
    return this.tasksService.updateTask(tripId, taskId, userId, body);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(
    @Param('tripId') tripId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.tasksService.deleteTask(tripId, taskId, userId);
  }
}
