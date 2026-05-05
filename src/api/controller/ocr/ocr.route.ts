import multer from 'multer';
import { TRoute } from '../../../types/common';
import { OcrPaySlipPayment } from './ocr';

// Configure multer for memory storage
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const Routes: TRoute[] = [
    {
        method: 'post',
        path: '/ocr/payslip-payment',
        handler: OcrPaySlipPayment,
        middleware: upload.single('imageUrl') // รองรับ file upload
    }
]

export default Routes;