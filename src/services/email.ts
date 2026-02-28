
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/email";
import { getInvoiceEmailTemplate, getReminderEmailTemplate, getPaymentConfirmationTemplate } from "@/emails/templates";
import { generateInvoicePdfBuffer } from "@/lib/pdf-server";
import { generateQRCode, generateSPDCString } from "@/lib/qr";
import { Invoice, Client, Organization, BankDetail, InvoiceItem } from "@prisma/client";

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('cs-CZ').format(date);
};

async function getInvoiceWithDetails(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      organization: true,
      items: true,
      bankDetail: true,
    },
  });

  if (!invoice) throw new Error("Invoice not found");
  if (!invoice.client.email) throw new Error("Client has no email address");

  return invoice;
}

async function generatePdfForInvoice(invoice: any) {
  // Generate QR Code
  let qrCodeUrl = "";
  if (invoice.bankDetail && invoice.bankDetail.iban) {
    const spdString = generateSPDCString({
      iban: invoice.bankDetail.iban,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      variableSymbol: invoice.variableSymbol || undefined,
      constantSymbol: invoice.constantSymbol || undefined,
      specificSymbol: invoice.specificSymbol || undefined,
      date: invoice.dueAt,
      message: `Faktura ${invoice.number}`,
    });
    qrCodeUrl = await generateQRCode(spdString);
  }

  // Generate PDF
  return generateInvoicePdfBuffer({
    invoice,
    organization: invoice.organization,
    client: invoice.client,
    bankDetail: invoice.bankDetail,
    qrCodeUrl,
  });
}

export async function sendInvoiceEmail(invoiceId: string) {
  const invoice = await getInvoiceWithDetails(invoiceId);
  const pdfBuffer = await generatePdfForInvoice(invoice);

  // Create Log
  const emailLog = await prisma.emailLog.create({
    data: {
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      organizationId: invoice.organizationId,
      recipient: invoice.client.email!,
      subject: `Faktura ${invoice.number} - ${invoice.organization.name}`,
      body: "Invoice Email",
      status: "SENT",
    },
  });

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/track/${emailLog.id}`;
  
  const html = getInvoiceEmailTemplate(
    invoice.client.name,
    invoice.number,
    formatCurrency(invoice.totalAmount, invoice.currency),
    formatDate(invoice.dueAt),
    undefined,
    trackingUrl
  );

  try {
    await transporter.sendMail({
      from: `"${invoice.organization.name}" <${process.env.SMTP_USER || 'vulpi@lcepelak.cz'}>`,
      to: invoice.client.email!,
      bcc: process.env.ARCHIVE_EMAIL,
      subject: `Faktura ${invoice.number}`,
      html,
      attachments: [
        {
          filename: `Faktura_${invoice.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

export async function sendReminderEmail(invoiceId: string, daysOverdue: number) {
  const invoice = await getInvoiceWithDetails(invoiceId);
  const pdfBuffer = await generatePdfForInvoice(invoice);

  const subject = daysOverdue < 0 
    ? `Blíží se splatnost faktury ${invoice.number}`
    : `Upomínka: Faktura ${invoice.number} po splatnosti`;

  // Create Log
  const emailLog = await prisma.emailLog.create({
    data: {
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      organizationId: invoice.organizationId,
      recipient: invoice.client.email!,
      subject: subject,
      body: `Reminder Email (Overdue: ${daysOverdue} days)`,
      status: "SENT",
    },
  });

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/track/${emailLog.id}`;

  const html = getReminderEmailTemplate(
    invoice.client.name,
    invoice.number,
    formatCurrency(invoice.totalAmount, invoice.currency),
    formatDate(invoice.dueAt),
    daysOverdue,
    invoice.variableSymbol || "-",
    trackingUrl
  );

  try {
    await transporter.sendMail({
      from: `"${invoice.organization.name}" <${process.env.SMTP_USER || 'vulpi@lcepelak.cz'}>`,
      to: invoice.client.email!,
      bcc: process.env.ARCHIVE_EMAIL,
      subject: subject,
      html,
      attachments: [
        {
          filename: `Faktura_${invoice.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

export async function sendPaymentConfirmationEmail(invoiceId: string, amountPaid: number) {
  const invoice = await getInvoiceWithDetails(invoiceId);
  
  // Create Log
  const emailLog = await prisma.emailLog.create({
    data: {
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      organizationId: invoice.organizationId,
      recipient: invoice.client.email!,
      subject: `Potvrzení úhrady faktury ${invoice.number}`,
      body: "Payment Confirmation Email",
      status: "SENT",
    },
  });

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/track/${emailLog.id}`;

  const html = getPaymentConfirmationTemplate(
    invoice.client.name,
    invoice.number,
    formatCurrency(amountPaid, invoice.currency),
    trackingUrl
  );

  try {
    await transporter.sendMail({
      from: `"${invoice.organization.name}" <${process.env.SMTP_USER || 'vulpi@lcepelak.cz'}>`,
      to: invoice.client.email!,
      bcc: process.env.ARCHIVE_EMAIL,
      subject: `Potvrzení úhrady faktury ${invoice.number}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}
