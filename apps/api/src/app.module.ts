import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { OrdersModule } from './orders/orders.module';
import { MidtransModule } from './midtrans/midtrans.module';
import { MenuModule } from './menu/menu.module';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';

@Module({
  imports: [PrismaModule, OrdersModule, MidtransModule, MenuModule, AuthModule, StaffModule],
})
export class AppModule {}