import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReimbursementService } from './reimbursement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReimbursementStatus, ExpenseCategory, UserRole } from '@prisma/client';

@Controller('reimbursements')
@UseGuards(JwtAuthGuard)
export class ReimbursementController {
  constructor(private reimbursementService: ReimbursementService) {}

  @Post()
  async createRequest(
    @Request() req,
    @Body()
    data: {
      amount: number;
      category: ExpenseCategory;
      description: string;
      receiptUrl: string;
    },
  ) {
    return this.reimbursementService.createRequest(req.user.id, data);
  }

  @Get('me')
  async getUserRequests(@Request() req) {
    return this.reimbursementService.getUserRequests(req.user.id);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getAllRequests(@Request() req) {
    return this.reimbursementService.getAllRequests(req.user.id);
  }

  @Get(':id')
  async getRequestById(@Request() req, @Param('id') requestId: string) {
    return this.reimbursementService.getRequestById(requestId, req.user.id);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateRequestStatus(
    @Request() req,
    @Param('id') requestId: string,
    @Body() data: { status: ReimbursementStatus; feedback?: string },
  ) {
    return this.reimbursementService.updateRequestStatus(
      requestId,
      req.user.id,
      data.status,
      data.feedback,
    );
  }
} 