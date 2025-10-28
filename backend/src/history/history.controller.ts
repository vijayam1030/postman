import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import type { RequestHistory } from './history.entity';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  addToHistory(
    @Body() data: { request: any; response: any },
  ): RequestHistory {
    return this.historyService.addToHistory(data.request, data.response);
  }

  @Get()
  getHistory(): RequestHistory[] {
    return this.historyService.getHistory();
  }

  @Get(':id')
  getHistoryById(@Param('id') id: string): RequestHistory | undefined {
    return this.historyService.getHistoryById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteHistoryItem(@Param('id') id: string): void {
    this.historyService.deleteHistoryItem(id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clearHistory(): void {
    this.historyService.clearHistory();
  }
}
