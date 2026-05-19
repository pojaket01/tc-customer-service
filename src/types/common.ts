import { Request, RequestHandler, Response } from "express";

export type TRoute = {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  handler: (req: Request, res: Response) => void;
  middleware?: RequestHandler | RequestHandler[]; // เพิ่ม middleware support
};
