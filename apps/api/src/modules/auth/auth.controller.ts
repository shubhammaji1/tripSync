import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { acceptInvitationSchema, AcceptInvitationInput, loginSchema, registerSchema, LoginInput, RegisterInput } from '@tripsync/validation';
import { Profile } from '@tripsync/types';

@ApiTags('Auth & Profiles')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with email and password or demo credentials' })
  @ApiResponse({ status: 200, description: 'Authentication successful with JWT token' })
  async login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.authService.login(body);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new traveler user account' })
  @ApiResponse({ status: 201, description: 'User account successfully registered' })
  async register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Create an account from a trip invitation and set a password' })
  async acceptInvitation(@Body(new ZodValidationPipe(acceptInvitationSchema)) body: AcceptInvitationInput) {
    return this.authService.acceptInvitation(body);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getCurrentUser(@CurrentUser() user: Profile) {
    return this.authService.getCurrentUserProfile(user);
  }

  @Get('personas')
  @ApiOperation({ summary: 'Get list of the 4 RBAC demo personas (OWNER, ADMIN, MEMBER, VIEWER)' })
  async getPersonas() {
    return this.authService.getDemoPersonas();
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out current session' })
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }
}
