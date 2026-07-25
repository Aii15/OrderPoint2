import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

// BARU — didefinisikan manual, bukan pakai Express.Multer.File, supaya tidak
// bergantung pada merge namespace global antara @types/express & @types/multer
// yang sering bentrok versi (terutama di monorepo dengan banyak node_modules
// bertingkat). Field-field ini yang benar-benar kita pakai dari objek file
// yang dikirim multer.
export interface UploadedMulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  // Dipakai apps/kiosk (tanpa auth) untuk membangun katalog menu lengkap.
  findAll() {
    return this.prisma.menuItem.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  findByCategory(category: string) {
    return this.prisma.menuItem.findMany({
      where: { category },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Menu item "${id}" tidak ditemukan`);
    return item;
  }

  async create(dto: CreateMenuItemDto) {
    const existing = await this.prisma.menuItem.findUnique({ where: { id: dto.id } });
    if (existing) {
      throw new ConflictException(`Menu item dengan id "${dto.id}" sudah ada`);
    }

    return this.prisma.menuItem.create({
      data: {
        id: dto.id,
        category: dto.category,
        name: dto.name,
        description: dto.description,
        composition: dto.composition,
        attributes: dto.attributes as unknown as object,
        meters: dto.meters as unknown as object,
        servingDetails: dto.servingDetails,
        price: dto.price,
        availability: dto.availability,
        imageAlt: dto.imageAlt,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id); // memastikan item lama ada, lempar 404 kalau tidak

    // Admin ganti Id (slug). Cek dulu id baru belum dipakai item lain.
    if (dto.id && dto.id !== id) {
      const conflict = await this.prisma.menuItem.findUnique({ where: { id: dto.id } });
      if (conflict) {
        throw new ConflictException(`Menu item dengan id "${dto.id}" sudah ada`);
      }
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        ...dto,
        attributes: dto.attributes ? (dto.attributes as unknown as object) : undefined,
        meters: dto.meters ? (dto.meters as unknown as object) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.menuItem.delete({ where: { id } });
    return { deleted: true, id };
  }

  // BARU — direktori tempat gambar menu ditulis. Default-nya menunjuk ke
  // apps/kiosk/public/images (satu monorepo, satu filesystem — sesuai model
  // deployment LAN lokal proyek ini, bukan microservice terpisah dengan
  // storage sendiri-sendiri). Bisa di-override lewat env KIOSK_IMAGES_DIR
  // kalau struktur foldernya beda di mesin lain.
  private get imagesDir(): string {
    return process.env.KIOSK_IMAGES_DIR ?? path.join(process.cwd(), '../kiosk/public/images');
  }

  async saveImage(id: string, file: UploadedMulterFile): Promise<{ path: string }> {
    if (file.mimetype !== 'image/png') {
      throw new BadRequestException('Gambar harus format PNG (.png)');
    }

    const dir = this.imagesDir;
    await fsPromises.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${id}.png`);
    await fsPromises.writeFile(filePath, file.buffer);

    // Path relatif ini yang dipakai <img> di apps/kiosk & ImagePreview admin,
    // sesuai konvensi lama: {NEXT_PUBLIC_KIOSK_BASE_URL}/images/{id}.png
    return { path: `/images/${id}.png` };
  }
}