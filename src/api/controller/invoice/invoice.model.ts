// create invoice model for database
import { Types } from '@tc-customer/package'
import mongoose, { Schema } from 'mongoose'

const InvoiceDetailSchema: Schema = new Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    quantityUnit: { type: String, required: true },
    price: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
});

const InvoiceSchema: Schema = new Schema({
    invoiceNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    sellerName: { type: String, required: true },
    reference: { type: String, required: false },
    projectName: { type: String, required: false },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    discount: { type: Number, required: false },
    totalAmount: { type: Number, required: true },
    isPaymentTerm: { type: Boolean, required: true },
    paymentTermsAmount: { type: Number, required: false },
    paymentTermsPercentage: { type: Number, required: false },
    taxPercentage: { type: Number, required: false },
    taxAmount: { type: Number, required: false },
    amountDue: { type: Number, required: true },
    details: { type: [InvoiceDetailSchema], required: false  },
    remarks: { type: String, required: false },
    status: { type: String, enum: ['paid', 'unpaid', 'overdue'], required: true }
}, { timestamps: true });


export const Invoice = mongoose.model<Types.IInvoice>('Invoice', InvoiceSchema);