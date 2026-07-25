import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // PUBLIK — dipakai halaman login apps/cashier untuk isi dropdown nama staf.
  // Sengaja TIDAK menyertakan field `pin`.
  findActive() {
    return this.prisma.staff.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  // TERPROTEKSI — dipakai apps/admin, termasuk staf nonaktif supaya bisa
  // diaktifkan lagi. Tetap tanpa field `pin` di response.
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
    const staff = await this.prisma.staff.create({ data: { name: dto.name, pin: dto.pin } });
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

    const staff = await this.prisma.staff.update({ where: { id }, data: dto });
    const { pin, ...safe } = staff;
    return safe;
  }

  // Aman secara database — Staff.id cuma disimpan sebagai SNAPSHOT string di
  // Order.servedByStaffId (bukan foreign key), jadi hapus staf tidak pernah
  // merusak riwayat order lama. Sama seperti prinsip MenuItem di Bagian 7.
  async remove(id: string) {
    const existing = await this.prisma.staff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Staf tidak ditemukan');
    await this.prisma.staff.delete({ where: { id } });
    return { deleted: true, id };
  }
}