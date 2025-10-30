import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiResponse, ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    status: 200,
    type: LoginResponseDto,
    description: 'User login',
  })
  @ApiOperation({ summary: 'Login de usuário' })
  @Post('login')
  async login(@Req() req: Request, @Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto, req);
    return result;
  }

  @ApiOperation({ summary: 'Logout de usuário' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
  })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @CurrentUser() user: any) {
    await this.authService.logout(user, req);
    return { message: 'Logout realizado com sucesso' };
  }
}
