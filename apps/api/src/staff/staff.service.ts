import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

const PIN_SALT_ROUNDS = 10;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    return this.prisma.staff.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  findAll() {
    return this.prisma.staff.findMany({
      select: { id: true, name: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateStaffDto) {
    const existing = await this.prisma.staff.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Staf dengan nama "${dto.name}" sudah ada`);
    }
    const hashedPin = await bcrypt.hash(dto.pin, PIN_SALT_ROUNDS);
    const staff = await this.prisma.staff.create({ data: { name: dto.name, pin: hashedPin } });
    const { pin, ...safe } = staff;
    return safe;
  }

  async update(id: string, dto: UpdateStaffDto) {
    const existing = await this.prisma.staff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Staf tidak ditemukan');

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.staff.findUnique({ where: { name: dto.name } });
      if (conflict) throw new ConflictException(`Staf dengan nama "${dto.name}" sudah ada`);
    }

    // BARU — kalau PIN diubah, hash dulu sebelum disimpan. Field lain (name,
    // active) lewat apa adanya.
    const data = { ...dto };
    if (dto.pin) {
      data.pin = await bcrypt.hash(dto.pin, PIN_SALT_ROUNDS);
    }

    const staff = await this.prisma.staff.update({ where: { id }, data });
    const { pin, ...safe } = staff;
    return safe;
  }

  async remove(id: string) {
    const existing = await this.prisma.staff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Staf tidak ditemukan');
    await this.prisma.staff.delete({ where: { id } });
    return { deleted: true, id };
  }
}