import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { BaseController } from '../../../core/common/base.controller';
import { Public } from '../../../core/security/decorators/public.decorator';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';


export class LoginRequestBody {
  email!: string;
  password!: string;
}

export class RefreshRequestBody {
  refreshToken!: string;
}

@ApiTags('Authentication & IAM')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController extends BaseController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super(AuthController.name);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user via email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful, returns tokens and user profile.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() body: LoginRequestBody, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const requestId = req.headers['x-request-id'] as string;

    return this.authService.login(body.email, body.password, ipAddress, userAgent, requestId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({ status: 200, description: 'Token rotated successfully.' })
  async refresh(@Body() body: RefreshRequestBody, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.authService.refresh(body.refreshToken, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke active refresh token session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(@CurrentUser('sub') userId: string, @Body() body?: Partial<RefreshRequestBody>) {
    await this.authService.logout(userId, body?.refreshToken);
    return { message: 'Logged out successfully.' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile, roles, and permissions' })
  @ApiResponse({ status: 200, description: 'User profile retrieved.' })
  async me(@CurrentUser('sub') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active refresh token sessions for current user' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved.' })
  async getSessions(@CurrentUser('sub') userId: string, @Req() req: Request) {
    const refreshTokenHeader = req.headers['x-refresh-token'] as string;
    return this.authService.getUserSessions(userId, refreshTokenHeader);
  }

  @Delete('sessions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke specific refresh token session by ID' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully.' })
  async revokeSession(@CurrentUser('sub') userId: string, @Param('id') sessionId: string) {
    await this.authService.revokeSession(userId, sessionId);
    return { message: `Session ${sessionId} revoked successfully.` };
  }
}
