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
import { MembersService } from './members.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  InviteMemberInput,
  UpdateMemberRoleInput,
} from '@tripsync/validation';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('trips/:tripId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all members for a trip' })
  async getTripMembers(@Param('tripId') tripId: string) {
    return this.membersService.getTripMembers(tripId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Generate invitation link for a new member' })
  async inviteMember(
    @Param('tripId') tripId: string,
    @CurrentUser('id') invitedBy: string,
    @Body(new ZodValidationPipe(inviteMemberSchema)) body: InviteMemberInput
  ) {
    return this.membersService.inviteMember(tripId, invitedBy, body);
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Update role of a trip member (OWNER/ADMIN/MEMBER/VIEWER)' })
  async updateMemberRole(
    @Param('tripId') tripId: string,
    @Param('userId') memberUserId: string,
    @Body(new ZodValidationPipe(updateMemberRoleSchema)) body: UpdateMemberRoleInput
  ) {
    return this.membersService.updateMemberRole(tripId, memberUserId, body);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove a member from the trip' })
  async removeMember(
    @Param('tripId') tripId: string,
    @Param('userId') memberUserId: string
  ) {
    return this.membersService.removeMember(tripId, memberUserId);
  }
}
