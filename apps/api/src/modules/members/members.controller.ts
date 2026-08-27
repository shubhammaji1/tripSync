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
  bulkInviteMemberSchema,
  createShareLinkSchema,
  updateMemberRoleSchema,
  InviteMemberInput,
  BulkInviteMemberInput,
  CreateShareLinkInput,
  UpdateMemberRoleInput,
} from '@tripsync/validation';
import { TripRole } from '@tripsync/types';

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

  @Get('share-link')
  @ApiOperation({ summary: 'Get or generate universal shareable invite link for the trip' })
  async getShareLink(
    @Param('tripId') tripId: string,
    @CurrentUser('id') invitedBy: string,
  ) {
    return this.membersService.getOrCreateShareLink(tripId, invitedBy, TripRole.MEMBER);
  }

  @Post('share-link')
  @ApiOperation({ summary: 'Create or refresh universal shareable invite link for the trip' })
  async createShareLink(
    @Param('tripId') tripId: string,
    @CurrentUser('id') invitedBy: string,
    @Body(new ZodValidationPipe(createShareLinkSchema)) body: CreateShareLinkInput,
  ) {
    return this.membersService.getOrCreateShareLink(tripId, invitedBy, body.role || TripRole.MEMBER);
  }

  @Post('bulk-invite')
  @ApiOperation({ summary: 'Send invites to multiple email addresses at once' })
  async bulkInvite(
    @Param('tripId') tripId: string,
    @CurrentUser('id') invitedBy: string,
    @Body(new ZodValidationPipe(bulkInviteMemberSchema)) body: BulkInviteMemberInput,
  ) {
    return this.membersService.bulkInviteMembers(tripId, invitedBy, body.emails, body.role);
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
    @CurrentUser('id') actingUserId: string,
    @Param('userId') memberUserId: string,
    @Body(new ZodValidationPipe(updateMemberRoleSchema)) body: UpdateMemberRoleInput
  ) {
    return this.membersService.updateMemberRole(tripId, actingUserId, memberUserId, body);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove a member from the trip' })
  async removeMember(
    @Param('tripId') tripId: string,
    @CurrentUser('id') actingUserId: string,
    @Param('userId') memberUserId: string
  ) {
    return this.membersService.removeMember(tripId, actingUserId, memberUserId);
  }
}
