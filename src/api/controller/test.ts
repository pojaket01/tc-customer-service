import { Constant, Logs } from "@tc-customer/package";
import { Request, Response } from 'express';
const { Logger } = Logs;
const { CampaignType } = Constant;

const test = (req: Request, res: Response) => {
    // console.log("Testing CampaignType enum:", Constant.CampaignType.EmailCampaign);
    Logger.info("Test endpoint hit");
    res.json({
        success: true,
        message: 'Test endpoint working',
        campaignType: CampaignType.EmailCampaign
    });
}


export {
    test
};

