import { HttpError } from 'wasp/server';
import { checkAuth, checkOrganization } from '../../server/auth/permissions';

// ============================================
// CREATE MANUAL INVOICE (for PO matching)
// ============================================

type CreateManualInvoiceInput = {
  purchaseOrderId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendor: string;
  description: string;
  totalAmount: number;
  taxAmount: number;
  lineItems: Array<{
    description: string;
    propertyId: string;
    glAccountId: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
  }>;
};

export const createManualInvoice = async (
  args: CreateManualInvoiceInput,
  context: any
) => {
  checkAuth(context.user);
  checkOrganization(context.user);

  const {
    purchaseOrderId,
    invoiceNumber,
    invoiceDate,
    dueDate,
    vendor,
    description,
    totalAmount,
    taxAmount,
    lineItems,
  } = args;

  // Check for duplicate invoice number within org
  const existingInvoice = await context.entities.Invoice.findFirst({
    where: {
      userId: context.user.id,
      invoiceNumber,
    },
  });

  if (existingInvoice) {
    throw new HttpError(400, `Invoice number ${invoiceNumber} already exists`);
  }

  // If linked to PO, validate it
  let purchaseOrder: any = null;
  if (purchaseOrderId) {
    purchaseOrder = await context.entities.PurchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { lineItems: true },
    });

    if (!purchaseOrder) {
      throw new HttpError(404, 'Purchase order not found');
    }

    if (purchaseOrder.organizationId !== context.user.organizationId) {
      throw new HttpError(403, 'Access denied');
    }

    if (purchaseOrder.status !== 'APPROVED') {
      throw new HttpError(400, 'Can only create invoices for approved purchase orders');
    }

    // Check if PO already has an invoice (check from PO side since it owns the FK)
    if (purchaseOrder.linkedInvoiceId) {
      throw new HttpError(400, 'Purchase order already has an invoice');
    }
  }

  // Calculate subtotal from line items
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // Create invoice with manual entry type
  const invoice = await context.entities.Invoice.create({
    data: {
      userId: context.user.id,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      vendorName: vendor,
      totalAmount,
      currency: 'USD',
      status: 'COMPLETED', // Manual invoices are already "completed" (no OCR needed)
      // Manual invoice specific fields
      fileName: `Manual Invoice ${invoiceNumber}`,
      mimeType: 'application/manual',
      fileUrl: '', // No file for manual invoices
      fileSize: 0,
      // Structured data
      structuredData: {
        dueDate,
        description,
        subtotal,
        taxAmount,
      },
      // Line items
      lineItems: {
        create: lineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          category: null,
          lineNumber: index + 1,
        })),
      },
    },
    include: {
      lineItems: true,
    },
  });

  // If linked to PO, update PO status
  if (purchaseOrderId && purchaseOrder) {
    await context.entities.PurchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: 'INVOICED',
        linkedInvoiceId: invoice.id,
      },
    });

    // Create notification for PO creator
    if (purchaseOrder.createdById !== context.user.id) {
      await context.entities.Notification.create({
        data: {
          userId: purchaseOrder.createdById,
          type: 'INVOICE_CREATED',
          title: 'Invoice Created',
          message: `Invoice ${invoiceNumber} created for PO #${purchaseOrder.poNumber}`,
          read: false,
        },
      });
    }
  }

  return invoice;
};

// ============================================
// UPDATE MANUAL INVOICE
// ============================================

type UpdateManualInvoiceInput = {
  id: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  vendor?: string;
  description?: string;
  totalAmount?: number;
  taxAmount?: number;
  lineItems?: Array<{
    description: string;
    propertyId: string;
    glAccountId: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
  }>;
};

export const updateManualInvoice = async (
  args: UpdateManualInvoiceInput,
  context: any
) => {
  checkAuth(context.user);
  checkOrganization(context.user);

  const { id, lineItems, ...updateData } = args;

  const invoice = await context.entities.Invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  if (invoice.userId !== context.user.id) {
    throw new HttpError(403, 'Access denied');
  }

  // Don't allow editing of OCR invoices
  if (invoice.mimeType !== 'application/manual') {
    throw new HttpError(400, 'Can only edit manually created invoices');
  }

  // Check if invoice is paid
  const structuredData = invoice.structuredData as any;
  if (structuredData?.paymentStatus === 'PAID') {
    throw new HttpError(400, 'Cannot edit paid invoices');
  }

  // Build update data
  const updatedData: any = {};

  if (updateData.invoiceNumber) updatedData.invoiceNumber = updateData.invoiceNumber;
  if (updateData.invoiceDate) updatedData.invoiceDate = new Date(updateData.invoiceDate);
  if (updateData.vendor) updatedData.vendorName = updateData.vendor;
  if (updateData.totalAmount !== undefined) updatedData.totalAmount = updateData.totalAmount;

  // Update structured data
  if (updateData.dueDate || updateData.description || updateData.taxAmount !== undefined) {
    const currentStructuredData = (invoice.structuredData as any) || {};
    updatedData.structuredData = {
      ...currentStructuredData,
      ...(updateData.dueDate && { dueDate: updateData.dueDate }),
      ...(updateData.description && { description: updateData.description }),
      ...(updateData.taxAmount !== undefined && { taxAmount: updateData.taxAmount }),
    };
  }

  // Update line items if provided
  if (lineItems) {
    // Delete existing line items
    await context.entities.InvoiceLineItem.deleteMany({
      where: { invoiceId: id },
    });

    // Create new line items
    await Promise.all(
      lineItems.map((item, index) =>
        context.entities.InvoiceLineItem.create({
          data: {
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            category: null,
            lineNumber: index + 1,
          },
        })
      )
    );

    // Recalculate subtotal
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    updatedData.structuredData = {
      ...(updatedData.structuredData || invoice.structuredData),
      subtotal,
    };
  }

  // Update invoice
  const updatedInvoice = await context.entities.Invoice.update({
    where: { id },
    data: updatedData,
    include: {
      lineItems: true,
    },
  });

  return updatedInvoice;
};

// ============================================
// MARK INVOICE AS PAID
// ============================================

type MarkInvoicePaidInput = {
  id: string;
  paidDate: string;
  paymentMethod?: string;
  paymentReference?: string;
};

export const markInvoicePaid = async (
  args: MarkInvoicePaidInput,
  context: any
) => {
  checkAuth(context.user);
  checkOrganization(context.user);

  const { id, paidDate, paymentMethod, paymentReference } = args;

  const invoice = await context.entities.Invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  if (invoice.userId !== context.user.id) {
    throw new HttpError(403, 'Access denied');
  }

  const structuredData = (invoice.structuredData as any) || {};
  
  if (structuredData.paymentStatus === 'PAID') {
    throw new HttpError(400, 'Invoice is already marked as paid');
  }

  const updatedInvoice = await context.entities.Invoice.update({
    where: { id },
    data: {
      structuredData: {
        ...structuredData,
        paymentStatus: 'PAID',
        paidDate,
        paymentMethod,
        paymentReference,
      },
    },
  });

  // Create notification
  await context.entities.Notification.create({
    data: {
      userId: invoice.userId,
      type: 'INVOICE_PAID',
      title: 'Invoice Paid',
      message: `Invoice ${invoice.invoiceNumber} has been marked as paid`,
      read: false,
    },
  });

  return updatedInvoice;
};

// ============================================
// DELETE MANUAL INVOICE
// ============================================

type DeleteManualInvoiceInput = {
  id: string;
};

export const deleteManualInvoice = async (
  args: DeleteManualInvoiceInput,
  context: any
) => {
  checkAuth(context.user);
  checkOrganization(context.user);

  const invoice = await context.entities.Invoice.findUnique({
    where: { id: args.id },
    include: {
      lineItems: true,
    },
  });

  if (!invoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  if (invoice.userId !== context.user.id) {
    throw new HttpError(403, 'Access denied');
  }

  // Don't allow deleting OCR invoices through this operation
  if (invoice.mimeType !== 'application/manual') {
    throw new HttpError(400, 'Can only delete manually created invoices through this operation');
  }

  // Check if paid
  const structuredData = invoice.structuredData as any;
  if (structuredData?.paymentStatus === 'PAID') {
    throw new HttpError(400, 'Cannot delete paid invoices');
  }

  // If linked to PO, update PO status back to APPROVED
  if (invoice.linkedPurchaseOrder) {
    await context.entities.PurchaseOrder.update({
      where: { id: invoice.linkedPurchaseOrder},
      data: {
        status: 'APPROVED',
        linkedInvoiceId: null,
      },
    });
  }

  // Delete line items first
  await context.entities.InvoiceLineItem.deleteMany({
    where: { invoiceId: args.id },
  });

  // Delete invoice
  await context.entities.Invoice.delete({
    where: { id: args.id },
  });

  return { success: true };
};

// ============================================
// GET APPROVED POS WITHOUT INVOICES
// ============================================

// ============================================
// GET APPROVED POS WITHOUT INVOICES
// ============================================

export const getApprovedPOsWithoutInvoices = async (
  args: any,
  context: any
) => {
  checkAuth(context.user);
  checkOrganization(context.user);

  // Get approved POs without invoices
  const approvedPOs = await context.entities.PurchaseOrder.findMany({
    where: {
      organizationId: context.user.organizationId,
      status: 'APPROVED',
      linkedInvoiceId: null, // POs that don't have an invoice yet
    },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
      expenseType: true,
      lineItems: {
        include: {
          property: true,
          glAccount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return approvedPOs;
};

// ============================================
// GET MANUAL INVOICES
// ============================================

type GetManualInvoicesInput = {
  paymentStatus?: 'PAID' | 'PENDING';
};

export const getManualInvoices = async (
  args: GetManualInvoicesInput,
  context: any
) => {
  checkAuth(context.user);
  checkOrganization(context.user);

  const { paymentStatus } = args;

  const invoices = await context.entities.Invoice.findMany({
    where: {
      userId: context.user.id,
      mimeType: 'application/manual', // Only manual invoices
      ...(paymentStatus && {
        structuredData: {
          path: ['paymentStatus'],
          equals: paymentStatus,
        },
      }),
    },
    include: {
      lineItems: {
        orderBy: { lineNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invoices;
};

// ============================================
// GET SINGLE INVOICE (Manual or OCR)
// ============================================

type GetInvoiceByIdInput = {
  id: string;
};

export const getInvoiceById = async (
  args: GetInvoiceByIdInput,
  context: any
) => {
  checkAuth(context.user);

  const invoice = await context.entities.Invoice.findUnique({
    where: { id: args.id },
    include: {
      lineItems: {
        orderBy: { lineNumber: 'asc' },
      },
      linkedPurchaseOrder: {  // Add this to fetch the PO
        select: {
          id: true,
          poNumber: true,
          vendor: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  if (invoice.userId !== context.user.id) {
    throw new HttpError(403, 'Access denied');
  }

  // If linked to PO, get PO details
  let purchaseOrder = null;
  if (invoice.purchaseOrderId) {
    purchaseOrder = await context.entities.PurchaseOrder.findUnique({
      where: { id: invoice.purchaseOrderId },
      select: {
        id: true,
        poNumber: true,
        vendor: true,
        totalAmount: true,
        status: true,
      },
    });
  }

  return {
    ...invoice,
    purchaseOrder,
  };
};
