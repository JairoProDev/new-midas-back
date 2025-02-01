import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ReimbursementStatus, ExpenseCategory, UserRole } from '@prisma/client';

@Injectable()
export class ReimbursementService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async createRequest(
    userId: string,
    data: {
      amount: number;
      category: ExpenseCategory;
      description: string;
      receiptUrl: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const request = await this.prisma.reimbursementRequest.create({
      data: {
        ...data,
        submittedById: userId,
      },
      include: {
        submittedBy: true,
      },
    });

    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
    });

    for (const admin of admins) {
      await this.mailService.sendMail({
        to: admin.email,
        subject: 'New Reimbursement Request',
        text: `A new reimbursement request has been submitted by ${user.firstName} ${user.lastName} for ${data.amount}`,
      });
    }

    return request;
  }

  async getRequestById(requestId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const request = await this.prisma.reimbursementRequest.findUnique({
      where: { id: requestId },
      include: {
        submittedBy: true,
        approvedBy: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (user.role !== UserRole.ADMIN && request.submittedById !== userId) {
      throw new ForbiddenException('Not authorized to view this request');
    }

    return request;
  }

  async getUserRequests(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.reimbursementRequest.findMany({
      where: {
        submittedById: userId,
      },
      include: {
        submittedBy: true,
        approvedBy: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  async getAllRequests(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized to view all requests');
    }

    return this.prisma.reimbursementRequest.findMany({
      include: {
        submittedBy: true,
        approvedBy: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  async updateRequestStatus(
    requestId: string,
    adminId: string,
    status: ReimbursementStatus,
    feedback?: string,
  ) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized to update request status');
    }

    const request = await this.prisma.reimbursementRequest.update({
      where: { id: requestId },
      data: {
        status,
        feedback,
        approvedById: adminId,
        approvedAt: new Date(),
      },
      include: {
        submittedBy: true,
        approvedBy: true,
      },
    });

    // Notify the user who submitted the request
    await this.mailService.sendMail({
      to: request.submittedBy.email,
      subject: `Reimbursement Request ${status}`,
      text: `Your reimbursement request for ${request.amount} has been ${status.toLowerCase()}${
        feedback ? `\n\nFeedback: ${feedback}` : ''
      }`,
    });

    return request;
  }
} 