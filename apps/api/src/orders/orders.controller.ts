import { Body, Controller, Get, Headers, Param, Patch, Query } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { AuthService } from '../auth/auth.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  listActive() {
    return this.ordersService.listActiveOrders();
  }

  @Get('failed')
  listFailed() {
    return this.ordersService.listFailedOrders();
  }

  @Get('completed-today')
  listCompletedToday() {
    return this.ordersService.listCompletedToday();
  }

  @Get('history')
  listHistory(@Query('date') date?: string) {
    return this.ordersService.listByDate(date);
  }

  @Get('detail/:id')
  findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get(':midtransOrderId')
  findOne(@Param('midtransOrderId') midtransOrderId: string) {
    return this.ordersService.findByMidtransOrderId(midtransOrderId);
  }

  // Auth OPSIONAL, sengaja BUKAN @UseGuards(JwtAuthGuard): apps/kds memanggil
  // endpoint ini tanpa token sama sekali (dapur sengaja tanpa auth staf,
  // lihat README Bagian 10.B), sementara apps/cashier mengirim Bearer token
  // staf yang sedang login. Kalau token ada & valid, dicatat sebagai
  // servedByStaffId/servedByStaffName; kalau tidak, field itu dibiarkan
  // seperti sebelumnya.
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('orderStatus') orderStatus: OrderStatus,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;
    const payload = this.authService.tryVerify(token);
    const servedBy =
      payload?.role === 'staff' && payload.staffId && payload.staffName
        ? { staffId: payload.staffId, staffName: payload.staffName }
        : undefined;

    return this.ordersService.updateOrderStatus(id, orderStatus, servedBy);
  }
}