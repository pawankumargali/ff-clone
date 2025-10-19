import { Request, Response, Express, NextFunction } from 'express';
import authRouter from './auth.router.js';
import meetingRouter from './meeting.router.js';
import webhookRouter from './webhook.router.js';

import { APIError } from '../middleware/error.middleware.js';

export default function initRoutes(app: Express) {
    
     app.use('/api', authRouter);
     app.use('/api', meetingRouter);
     app.use('/api', webhookRouter);

    //health check route
    app.get('/health', (_: Request, res: Response) =>  res.status(200).json({status: 'OK'}));

    // throw 404 error when route is not found
    app.use(async (_: Request, __: Response, next: NextFunction) => {
        try {
            throw new APIError(404, 'Page Not Found');
        }
        catch(error) {
            next(error);
        }
    });
}
