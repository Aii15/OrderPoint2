import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Header Authorization Bearer wajib diisi');
    }

    const token = authHeader.slice('Bearer '.length);
    // BARU — payload ditempel ke request supaya controller (kalau perlu)
    // bisa tahu siapa yang login, bukan cuma valid/tidak.
    request.user = this.authService.verify(token);
    return true;
  }
}