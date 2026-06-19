import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}
export declare function authenticateJWT(req: Request, res: Response, next: NextFunction): void;
