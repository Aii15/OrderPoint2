import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MenuService, UploadedMulterFile } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // --- Endpoint PUBLIK (dipakai apps/kiosk, tanpa auth) ---

  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string) {
    return this.menuService.findByCategory(decodeURIComponent(category));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  // --- Endpoint TERPROTEKSI (dipakai apps/admin, wajib Bearer token) ---

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  uploadImage(@Param('id') id: string, @UploadedFile() file?: UploadedMulterFile) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diisi');
    }
    return this.menuService.saveImage(id, file);
  }
}