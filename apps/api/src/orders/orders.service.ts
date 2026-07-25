import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  }

  async getNextQueueNumber(): Promise<string> {
    const todayKey = this.getDateKey();

    return this.prisma.$transaction(async (tx) => {
      let counterRow = await tx.queueCounter.findUnique({ where: { id: 'singleton' } });

      if (!counterRow) {
        counterRow = await tx.queueCounter.create({
          data: { id: 'singleton', dateKey: todayKey, counter: 0 },
        });
      }

      if (counterRow.dateKey !== todayKey) {
        counterRow = await tx.queueCounter.update({
          where: { id: 'singleton' },
          data: { dateKey: todayKey, counter: 0 },
        });
      }

      const updated = await tx.queueCounter.update({
        where: { id: 'singleton' },
        data: { counter: { increment: 1 } },
      });

      const letter = String.fromCharCode(65 + Math.floor((updated.counter - 1) / 100));
      const number = ((updated.counter - 1) % 100) + 1;

      return `${letter}-${number.toString().padStart(3, '0')}`;
    });
  }

  async createOrder(dto: CreateOrderDto, midtransOrderId: string) {
    const queueNumber = await this.getNextQueueNumber();

    return this.prisma.order.create({
      data: {
        queueNumber,
        customerName: dto.customerName,
        items: JSON.stringify(dto.items),
        subtotal: dto.subtotal,
        tax: dto.tax,
        total: dto.total,
        midtransOrderId,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.NEW,
      },
    });
  }

  async findByMidtransOrderId(midtransOrderId: string) {
    const order = await this.prisma.order.findUnique({ where: { midtransOrderId } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }

  async updatePaymentStatus(midtransOrderId: string, paymentStatus: PaymentStatus) {
    return this.prisma.order.update({
      where: { midtransOrderId },
      data: { paymentStatus },
    });
  }

  async updateOrderStatus(
    id: string,
    orderStatus: OrderStatus,
    servedBy?: { staffId: string; staffName: string },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');

    return this.prisma.order.update({
      where: { id },
      data: {
        orderStatus,
        // Hanya ditulis kalau ada staf kasir yang login (request dari
        // apps/kds tidak membawa token, jadi field ini dibiarkan seperti
        // sebelumnya, tidak ditimpa jadi kosong).
        ...(servedBy
          ? { servedByStaffId: servedBy.staffId, servedByStaffName: servedBy.staffName }
          : {}),
      },
    });
  }

  // Dipakai monitor kasir & dapur: pesanan yang sudah dibayar dan belum selesai
  async listActiveOrders() {
    return this.prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID,
        orderStatus: { in: [OrderStatus.NEW, OrderStatus.IN_PROGRESS, OrderStatus.READY] },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Pesanan yang gagal/kedaluwarsa bayar, untuk rekonsiliasi kasir
  // Pesanan gagal/kedaluwarsa bayar HARI INI — dipakai tab "Gagal Bayar" di
  // apps/cashier maupun StatCard "Gagal Bayar" di dashboard apps/admin.
  // Sengaja di-scope harian, sama seperti listCompletedToday, supaya semua
  // angka ringkasan konsisten "hari ini" dan tidak nyangkut order lama.
  async listFailedOrders() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.order.findMany({
      where: {
        paymentStatus: { in: [PaymentStatus.EXPIRED, PaymentStatus.PENDING] },
        createdAt: { gte: startOfDay },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Riwayat pesanan selesai HARI INI (dipakai tab "Riwayat" di apps/cashier)
  async listCompletedToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.order.findMany({
      where: {
        orderStatus: { in: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        createdAt: { gte: startOfDay },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // BARU (apps/admin) — riwayat SEMUA pesanan (semua status) pada satu tanggal
  // tertentu, dipilih lewat kalender. Beda dari listCompletedToday: ini lintas
  // tanggal (bukan cuma hari ini) dan tidak difilter status (admin perlu lihat
  // yang gagal bayar / dibatalkan juga sebagai bagian dari riwayat).
  async listByDate(dateKey?: string) {
    const target = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();

    if (Number.isNaN(target.getTime())) {
      throw new BadRequestException('Format tanggal tidak valid, gunakan YYYY-MM-DD');
    }

    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.order.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // BARU (apps/admin) — detail satu order lewat id internal (cuid), dipakai
  // halaman /riwayat/[id]. Beda dari findByMidtransOrderId yang lookup lewat
  // midtransOrderId (dipakai kiosk untuk polling status pembayaran).
  async findById(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }
}