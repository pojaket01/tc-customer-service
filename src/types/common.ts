import { Request, RequestHandler, Response } from "express";

export type TRoute = {
  method: string;
  path: string;
  handler: (req: Request, res: Response) => void;
  middleware?: RequestHandler | RequestHandler[]; // เพิ่ม middleware support
};
