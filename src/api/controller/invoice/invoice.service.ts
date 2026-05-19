import { Request, Response } from "express"
import { Invoice } from "./invoice.model"
import { IInvoice } from "@tc-customer/package/types/invoice"
import { Types } from "@tc-customer/package"
async function GetInvoiceList(req: Request, res: Response) {
    const { page, pageSize, sortBy } = req.body as any

    // get data from database from docker (mongodb)
    let invoiceList: any[] = []

    await Invoice.find().skip((page - 1) * pageSize)
        .limit(pageSize)
        .then((invoices) => {
            invoiceList = invoices
        })
        .catch((err) => {
            console.error('Error fetching invoice list:', err)
            res.status(500).json({ error: 'Failed to fetch invoice list' })
        })

    return res.json({ data: invoiceList })
}

async function CreateInvoice(req: Request, res: Response) {
    try {
        console.log("🚀 ~ req.body:", req.body)
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            customerName,
            sellerName,
            reference,
            projectName,
            discount,
            totalAmount,
            isPaymentTerm,
            paymentTermsAmount,
            paymentTermsPercentage,
            taxPercentage,
            taxAmount,
            amountDue,
            details,
            status
        } = req.body as Types.IInvoice

        const newInvoice = new Invoice({
            invoiceNumber,
            invoiceDate,
            dueDate,
            customerName,
            sellerName,
            reference,
            projectName,
            discount,
            totalAmount,
            isPaymentTerm,
            paymentTermsAmount,
            paymentTermsPercentage,
            taxPercentage,
            taxAmount,
            amountDue,
            details,
            status
        })

        await newInvoice.save()
            .then(() => {
                res.status(201).json({ message: 'Invoice created successfully' })
            })
            .catch((err) => {
                console.error('Error creating invoice:', err)
                res.status(500).json({ error: 'Failed to create invoice' })
            })

        return res.json({ message: 'Invoice created successfully' })
    } catch (error) {
        console.error('Error creating invoice:', error)
        res.status(500).json({ error: 'Failed to create invoice' })
    }
}

async function UpdateInvoice(req: Request, res: Response) {
    const invoiceId = req.params.id
    const updateData = req.body as Partial<IInvoice>
    try {
        await Invoice.findByIdAndUpdate(invoiceId, updateData)
            .then(() => {
                res.json({ message: 'Invoice updated successfully' })
            })
            .catch((err) => {
                console.error('Error updating invoice:', err)
                res.status(500).json({ error: 'Failed to update invoice' })
            })
    } catch (error) {
        console.error('Error updating invoice:', error)
        res.status(500).json({ error: 'Failed to update invoice' })
    }
}

async function DeleteInvoice(req: Request, res: Response) {
    const invoiceId = req.params.id
    try {
        await Invoice.findByIdAndDelete(invoiceId)
            .then(() => {
                res.json({ message: 'Invoice deleted successfully' })
            })
            .catch((err) => {
                console.error('Error deleting invoice:', err)
                res.status(500).json({ error: 'Failed to delete invoice' })
            })
    } catch (error) {
        console.error('Error deleting invoice:', error)
        res.status(500).json({ error: 'Failed to delete invoice' })
    }
}

export {
    GetInvoiceList,
    CreateInvoice,
    UpdateInvoice,
    DeleteInvoice,
}