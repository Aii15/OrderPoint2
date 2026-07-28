import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthTokenPayload {
  role: 'admin' | 'staff';
  staffId?: string;
  staffName?: string;
}

// Auth "dasar" — PIN admin lewat env var, PLUS login per-staf kasir lewat
// tabel Staff. Dua-duanya menghasilkan JWT dengan secret yang sama, dibedakan
// lewat field `role` di payload. PIN staf sekarang tersimpan sebagai bcrypt
// hash di database (bukan plaintext) — ADMIN_PIN tetap plaintext di env var,
// keputusan sadar (lihat README Bagian 7/10).
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET belum di-set di apps/api/.env');
    }
    return secret;
  }

  login(pin: string): { token: string } {
    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin) {
      throw new Error('ADMIN_PIN belum di-set di apps/api/.env');
    }
    if (pin !== adminPin) {
      throw new UnauthorizedException('PIN salah');
    }

    const payload: AuthTokenPayload = { role: 'admin' };
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '12h' });
    return { token };
  }

  // Login staf kasir: pilih staffId (dari dropdown, lihat
  // StaffService.findActive) + PIN individu. Beda dari admin yang cuma satu
  // PIN bersama lewat env var.
  async loginStaff(staffId: string, pin: string): Promise<{ token: string; staffName: string }> {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });

    if (!staff || !staff.active) {
      throw new UnauthorizedException('Staf tidak ditemukan atau sudah nonaktif');
    }

    // BARU — staff.pin sekarang tersimpan sebagai bcrypt hash (lihat
    // StaffService.create/update), jadi dibandingkan pakai bcrypt.compare,
    // bukan perbandingan string langsung seperti sebelumnya.
    const pinMatches = await bcrypt.compare(pin, staff.pin);
    if (!pinMatches) {
      throw new UnauthorizedException('PIN salah');
    }

    const payload: AuthTokenPayload = { role: 'staff', staffId: staff.id, staffName: staff.name };
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '12h' });
    return { token, staffName: staff.name };
  }

  verify(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedException('Token tidak valid atau kedaluwarsa');
    }
  }

  // Dipakai OrdersController: coba verifikasi token KALAU ada, tapi TIDAK
  // melempar error kalau tidak ada/invalid. Ini yang memungkinkan
  // PATCH /orders/:id/status tetap bisa dipanggil tanpa login dari apps/kds
  // (dapur sengaja tanpa auth staf), sekaligus tetap mencatat siapa staf
  // kasir yang bertindak kalau ada token valid.
  tryVerify(token: string | undefined): AuthTokenPayload | null {
    if (!token) return null;
    try {
      return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
    } catch {
      return null;
    }
  }
}