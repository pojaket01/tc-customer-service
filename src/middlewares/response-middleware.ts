import { NextFunction, Request, Response } from "express";

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
    // Store the original res.json method
    const originalJson = res.json;

    // return response to client in a consistent format is
    // {
    //     code: number,
    //     success: boolean,
    //     message: string,
    //     data?: any
    // } // when success
    // return response to client in a consistent format is
    // {
    //     code: number,
    //     success: boolean,
    //     message: string,
    //     data?: any,
    // } // when error

    // Override res.json method
    res.json = function (data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Success response
            return originalJson.call(this, {
                code: res.statusCode,
                success: true,
                message: 'Request successful',
                ...(data ?? {}).data ? { data: data.data } : {}
            });
        } else {
            // Error response
            return originalJson.call(this, {
                code: res.statusCode,
                success: false,
                message: 'Request failed',
                ...(data ?? {}).data ? { data: data.data } : {}
            });
        }
    }
    next();
}