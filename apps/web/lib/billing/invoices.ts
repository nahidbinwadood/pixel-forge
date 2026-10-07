import "server-only";
import { prisma } from "@pixelforge/db";

export interface InvoiceRow {
  id: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
  createdAt: Date;
}

/** Most recent invoices for the settings billing section (lib/billing/webhook.ts populates these). */
export async function listInvoices(userId: string, limit = 10): Promise<InvoiceRow[]> {
  return prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amountDue: true,
      amountPaid: true,
      currency: true,
      status: true,
      hostedInvoiceUrl: true,
      createdAt: true,
    },
  });
}
