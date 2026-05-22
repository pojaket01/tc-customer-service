import { Request, Response } from 'express';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { OcrResult } from '../../../types';

async function OcrPaySlipPayment(req: Request, res: Response) {
    
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
        const ocrResult = await readImageText(imageData as Buffer);
        // เรียกใช้ฟังก์ชัน readOcrFromImage เพื่อดึงข้อมูลจากภาพ
        // const ocrResult = await readOcrFromImage(imageData);

        // ตัวอย่าง response ที่ส่งกลับไปยัง client
        return res.status(200).json({
            success: true,
            message: 'OCR processing successful',
            data: {
                ocrResult, // ข้อมูลจาก readImageText (raw text)
                // ocrResult   // ข้อมูลที่ดึงมาเป็น structured data จาก readOcrFromImage
            }
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

async function readImageText(imageBuffer: Buffer) {
    // console.log("🚀 ~ readImageText ~ imagePath:", imagePath)
    const worker = await createWorker('tha+eng');

    try {
        const processedBuffer = await sharp(imageBuffer)
        .grayscale() // ทำเป็นขาวดำ
        .threshold(180) // ตัดสีเทาออก ให้เหลือแค่ดำสนิทกับขาวสนิท
        .toBuffer();

        const { data: { text } } = await worker.recognize(processedBuffer);
        await worker.terminate();
        return extractSlipData(text);
    } catch (error: any) {
        console.error('❌ OCR Worker Error:', error.message);
        throw error;
    }
}
function extractSlipData(rawText: string) {
    // ลบช่องว่างที่ซ้ำซ้อนและบรรทัดว่างออกเพื่อให้ค้นหาง่ายขึ้น
    const cleanText = rawText.replace(/\s+/g, ' ');

    if (cleanText.length === 0) {
        console.warn('⚠️ OCR returned empty text');
        return {
            payerName: 'Unknown',
            amount: 0,
            transferDate: '',
            note: '',
            reference: '',
            merchant: '',
            rawText
        }
    }
    const payerNameMatch = cleanText.match(/นาย[^\s]+/)?.[0]?.trim() .replace('นาย','')
                    ?? cleanText.match(/บาย[^\s]+/)?.[0]?.trim().replace('บาย','')
                    ?? cleanText.match(/นาง[^\s]+/)?.[0]?.trim().replace('นาง','')
                    ?? cleanText.match(/นางสาว[^\s]+/)?.[0]?.trim().replace('นางสาว','')
                    ?? cleanText.match(/บางสาว[^\s]+/)?.[0]?.trim().replace('บางสาว','')
                    ?? 'Unknown'
    const amountMatch = cleanText.match(/จํานวนเงิน\s+([\d,.]+)\s*บาท/);
    const transferDateMatch = cleanText.match(/วันที่ทํารายการ\s+(\d{2}\s+[\w.\u0E00-\u0E7F]+\s+\d{4}\s+-\s+\d{2}:\d{2})/);
    const noteMatch = 
                    cleanText.match(/บันทึกช่วยจํา\s*[:\-]?\s*(.+)/i) 
                    ?? cleanText.match(/บันทึกชวยจํา\s*[:\-]?\s*(.+)/i) 
                    ?? cleanText.match(/บันทึ\s*[:\-]?\s*(.+)/i);
    const referenceMatch =  cleanText.match(/รหัสอ้างอิง[^\d]*(\d+)/)?.[1] 
    ?? cleanText.match(/รหัสอ้างฮิง[^\d]*(\d+)/)?.[1] 
    ?? ''
    // console.log("🚀 ~ extractSlipData ~ noteMatch:", noteMatch)

    
    const transferDate = transferDateMatch?.[1]?.trim() ?? '';
    console.log("🚀 ~ extractSlipData ~ transferDate:", transferDate)
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
        
        // แปลง "05 พ.ค. 2569 - 12:11" -> "2026-05-05T12:11:00"
        const dateMatch = transferDate.match(/(\d{2})\s+([\w.]+)\s+(\d{4})\s+-\s+(\d{2}):(\d{2})/) ?? transferDate.match(/(\d{2})\s+([ก-๙.]+)\s+(\d{4})\s*-\s*(\d{2}):(\d{2})/);
        console.log("🚀 ~ extractSlipData ~ dateMatch:", dateMatch)
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


    const data: OcrResult = {
        // referenceNo: cleanText.match(/รหัสอ้างอิง\s*([A-Za-z0-9]+)/)?.[1],
        // amount: cleanText.match(/จํานวนเงิน\s*([\d,]+\.\d{2})/)?.[1],
        // phoneNumber: cleanText.match(/หมายเลขโทรศัพท์มือถือ\s*(\d{10})/)?.[1],
        // date: cleanText.match(/วันที่ทํารายการ\s*([\d\s\w\.\-:]+)/)?.[1],
        payerName: payerNameMatch,
        amount: amountMatch ? parseFloat(String(amountMatch[1]).replace(',', '')) : 0,
        transferDate: parsedDate,
        note: noteMatch?.[1]?.trim() ?? '',
        reference: referenceMatch?.trim() ?? '',
        // merchant: cleanText.match(/[A-Z\s]{3,}/)?.[0]?.trim() ?? '',
        rawText: rawText // เก็บ raw text ไว้ด้วยเผื่อต้องการ debug
    };

    return data;
}

export {
    OcrPaySlipPayment
};

