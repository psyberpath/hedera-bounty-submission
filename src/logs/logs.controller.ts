import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { LogsService } from './logs.service';
import { CreateLogDto } from './create-log.dto';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  create(@Body() createLogDto: CreateLogDto) {
    return this.logsService.createLog(createLogDto);
  }

  @Get('verify/:id')
  verify(@Param('id') id: string) {
    return this.logsService.verifyLog(id);
  }
}
