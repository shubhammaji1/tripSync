import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MailService } from '../../common/mail.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService, MailService],
  exports: [MembersService, MailService],
})
export class MembersModule {}
