import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from 'utils/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserService],
  exports: [PrismaModule, UserService],
})
export class UserModule {}
