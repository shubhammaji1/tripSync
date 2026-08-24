import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  acceptInvitationSchema,
  AcceptInvitationInput,
  loginSchema,
  registerSchema,
  LoginInput,
  RegisterInput,
} from '@tripsync/validation';
import { Profile } from '@tripsync/types';

@ApiTags('Auth & Profiles')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate against Supabase Auth with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful, returns a Supabase session token' })
  async login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.authService.login(body);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new traveler account via Supabase Auth' })
  @ApiResponse({ status: 201, description: 'Account created (may require email confirmation)' })
  async register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Create an account from a trip invitation, set a password, and join the trip' })
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

  @Post('logout')
  @ApiOperation({ summary: 'Log out current session' })
  async logout() {
    // Session invalidation happens client-side (Supabase client clears the
    // local session / calls Supabase's own /auth/v1/logout with the token).
    // Nothing server-side to fabricate a response for.
    return { success: true };
  }
}
