import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body('pin') pin: string) {
    return this.authService.login(pin);
  }

  // BARU — login staf kasir
  @Post('staff-login')
  loginStaff(@Body('staffId') staffId: string, @Body('pin') pin: string) {
    return this.authService.loginStaff(staffId, pin);
  }
}