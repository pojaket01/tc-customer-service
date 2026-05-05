export interface OcrResult {
    payerName: string;
    amount: number;
    transferDate: string;
    note: string;
    reference: string;
    merchant: string;
    rawText: string;
}