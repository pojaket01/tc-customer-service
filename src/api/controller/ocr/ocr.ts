import { Request, Response } from 'express';
import sharp from 'sharp';
import { recognize } from 'tesseract.js';
import { OcrResult } from '../../../types';

async function OcrPaySlipPayment(req: Request, res: Response) {
    console.log("🚀 ~ OcrPaySlipPayment ~ req.body:", req.body);
    console.log("🚀 ~ OcrPaySlipPayment ~ req.file:", req.file);
    console.log("🚀 ~ OcrPaySlipPayment ~ req.headers:", req.headers);
    
    let imageData: string | Buffer | undefined;
    
    // รองรับทั้ง file upload และ JSON body
    if (req.file) {
        // กรณีส่งมาเป็น file upload (multipart/form-data)
        imageData = req.file.buffer;
        console.log("📤 Received file upload, size:", req.file.size, "bytes");
    } else if (req.body && req.body.imageUrl) {
        // กรณีส่งมาเป็น JSON body (application/json)
        imageData = req.body.imageUrl;
        console.log("📤 Received JSON with imageUrl");
    } else {
        return res.status(400).json({
            success: false,
            message: 'Please provide image data either as file upload (multipart/form-data) or JSON with imageUrl field',
            hint: {
                fileUpload: 'Use form field name "imageUrl" for file upload',
                json: 'Send JSON with { "imageUrl": "base64_or_url" }'
            }
        });
    }
    
    if (!imageData) {
        return res.status(400).json({
            success: false,
            message: 'Image data is required'
        });
    }

    try {
        // เรียกใช้ฟังก์ชัน readOcrFromImage เพื่อดึงข้อมูลจากภาพ
        const ocrResult = await readOcrFromImage(imageData);

        // ตัวอย่าง response ที่ส่งกลับไปยัง client
        return res.status(200).json({
            success: true,
            message: 'OCR processing successful',
            data: ocrResult
        });
    } catch (error: any) {
        console.error('❌ OCR Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process image',
            error: error.message
        });
    }
}

async function readOcrFromImage(imageUrl: string | Buffer): Promise<OcrResult> {
    // using tesseract.js for OCR processing
    try {
        // check image type and convert to buffer if it's a URL
        let imageBuffer: Buffer;
        
        // แปลงข้อมูลภาพให้เป็น Buffer
        if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
            const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (Buffer.isBuffer(imageUrl)) {
            imageBuffer = imageUrl;
        } else {
            throw new Error('Invalid image data');
        }

        // 1. Pre-process ภาพด้วย Sharp (สำคัญมากเพื่อให้ Tesseract อ่านแม่นขึ้น)
        const processedImage = await sharp(imageBuffer)
        .grayscale()
        .threshold(120) // ปรับค่าตามความเหมาะสมของสลิป
        .toBuffer();

        // 2. รัน Tesseract.js
        const config:Partial<Tesseract.WorkerOptions> = {
            
            // lang: 'tha+eng', // อ่านทั้งภาษาไทยและอังกฤษ
            // oem: OEM.DEFAULT, // ใช้ OCR Engine Mode ที่เหมาะสม
            // psm: 6 // Page Segmentation Mode ที่เหมาะสมกับสลิป
        }
        const { data: { text } } = await recognize(
        processedImage,
        'tha+eng',
        config
        );

        console.log("ข้อความที่อ่านได้:", text);
        
        // ดึงข้อมูลจากข้อความ OCR ด้วย regex
        const payerNameMatch = text.match(/นาย[^\s]+/); // ดึงชื่อผู้จ่าย
        const amountMatch = text.match(/จํานวนเงิน\s+([\d,.]+)\s*บาท/);
        const transferDateMatch = text.match(/วันที่ทํารายการ\s+([\d\s\w.:-]+)/);
        const noteMatch = text.match(/บันทึกช่วยจํา\s+(.+)/);
        const referenceMatch = text.match(/รหัสอ้างอิง[^\d]*(\d+)/); // รหัสอ้างอิง
        const merchantMatch = text.match(/[A-Z\s]{3,}/); // ชื่อร้านค้า (ภาษาอังกฤษ)

        // Extract และ clean ข้อมูล
        const payerName = payerNameMatch?.[0]?.trim() ?? 'Unknown';
        const amount = amountMatch?.[1] ? parseFloat(amountMatch[1].replace(',', '')) : 0;
        const transferDate = transferDateMatch?.[1]?.trim() ?? '';
        const note = noteMatch?.[1]?.trim() ?? '';
        const reference = referenceMatch?.[1] ?? '';
        const merchant = merchantMatch?.[0]?.trim() ?? '';

        // Parse วันที่ให้เป็น ISO format (ถ้าต้องการ)
        let parsedDate = transferDate;
        try {
            // Mapping เดือนภาษาไทย
            const monthMap: Record<string, string> = {
                'ม.ค.': '01', 'มกราคม': '01', 'มกรา': '01',
                'ก.พ.': '02', 'กุมภาพันธ์': '02', 'กุมภา': '02',
                'มี.ค.': '03', 'มีนาคม': '03', 'มีนา': '03',
                'เม.ย.': '04', 'เมษายน': '04', 'เมษา': '04',
                'พ.ค.': '05', 'พฤษภาคม': '05', 'พฤษภา': '05', 'w.A.': '05', // OCR อาจอ่าน พ.ค. เป็น w.A.
                'มิ.ย.': '06', 'มิถุนายน': '06', 'มิถุนา': '06',
                'ก.ค.': '07', 'กรกฎาคม': '07', 'กรกฎา': '07',
                'ส.ค.': '08', 'สิงหาคม': '08', 'สิงหา': '08',
                'ก.ย.': '09', 'กันยายน': '09', 'กันยา': '09',
                'ต.ค.': '10', 'ตุลาคม': '10', 'ตุลา': '10',
                'พ.ย.': '11', 'พฤศจิกายน': '11', 'พฤศจิกา': '11',
                'ธ.ค.': '12', 'ธันวาคม': '12', 'ธันวา': '12'
            };

            // แปลง "05 พ.ค. 2569 - 12:11" -> "2026-05-05T12:11:00"
            const dateMatch = transferDate.match(/(\d{2})\s+([\w.]+)\s+(\d{4})\s+-\s+(\d{2}):(\d{2})/);
            if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3] && dateMatch[4] && dateMatch[5]) {
                const day = dateMatch[1];
                const monthStr = dateMatch[2];
                const year = parseInt(dateMatch[3]) - 543; // แปลง พ.ศ. -> ค.ศ.
                const hour = dateMatch[4];
                const minute = dateMatch[5];
                
                // หาเดือนจาก mapping
                const month = monthMap[monthStr] || '01'; // default เป็น 01 ถ้าไม่เจอ
                
                parsedDate = `${year}-${month}-${day}T${hour}:${minute}:00`;
                console.log(`📅 Parsed date: ${transferDate} -> ${parsedDate}`);
            }
        } catch (e) {
            console.warn('⚠️ Cannot parse date:', e);
        }

        const result: OcrResult = {
            payerName,
            amount,
            transferDate: parsedDate,
            note,
            reference,
            merchant,
            rawText: text // เก็บ raw text ไว้ด้วยเผื่อต้องการ debug
        };

        console.log("📊 Extracted data:", result);

        return result;
    } catch (error) {
        console.error('❌ OCR Error:', error);
        throw new Error('Failed to process OCR');
    }
}

export {
    OcrPaySlipPayment
};

