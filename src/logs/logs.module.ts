import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { ComplianceLog } from './log.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceLog]), HttpModule],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogsModule {}
