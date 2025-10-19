import { Request, Response, Express, NextFunction } from "express";
import { z } from 'zod';

export class APIError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

export function initErrorHandler(app: Express) {
    app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
        const errorDetails = serializeError(error);
        console.log(JSON.stringify({
            type: "ERROR",
            level: "ERROR",
            error: {
                ...errorDetails,
                trace: error?.stack.substring(0, 500) || ""
            },
            req: {
                url: req.url,
                method: req.method,
                query: req.query,
                body: req.body,
                params: req.params,
                origin: req.headers.origin,
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                referer: req.headers.referer,
                host: req.headers.host,
                contentType: req.headers['content-type']
            },
            res: {
                error: errorDetails.error,
                message: errorDetails.message,
                status: errorDetails.status
            },
            timestamp: new Date().toISOString()
        }));
        return res.status(errorDetails.status).json({
            error: errorDetails.error,
            message: errorDetails.message
        });
    });
}

export function serializeError(error: any) {
    try {
        if(error instanceof z.ZodError) {
            // Get the first issue or use a default error message if no issues are found
            /**
             * Zod Error Data Structure:
             *  {
             *      issues: [
             *           {
             *              "expected": "number",
             *              "code": "invalid_type",
             *              "path": ["quantity"],
             * "message": "Invalid input: expected number, received undefined"
             * }
             *      ]
             *  }
             *
             *
             *
             *
             *
             */
            const issue = error.issues?.[0];
            const issueField = issue?.path?.join('.') || 'unknown';
            const issueMsg = issue?.message || 'Invalid value';
            const errMsg = `${issueMsg} for field \`${issueField}\``;
            return {
                error: "InvalidInputError",
                message: errMsg,
                status: 400
            };
        }

        if (error instanceof APIError) {
            // Get the first issue or use a default error message if no issues are found
            /**
             * API Error Data Structure:
             *  {
             *     "statusCode": 404,
             *      "message": "Forbidden"
             *  }
             */
            return {
                error: "APIError",
                message: error.message,
                status: error.statusCode
            };
        }

        if (error instanceof Error) {
             /**
             * Error Data Structure:
             *  {
             *      "name": "number",
             *      "message": "Invalid input: expected number, received undefined",
             *      "stack": "stack trace of the error"
             *
             *  }
             */
            return {
                error: "InternalServerError",
                message: error.message,
                status: 500
            };
        }

        if(error instanceof String) {
            return {
                error: "InternalServerError",
                message: error,
                status: 500
            };
        }
        throw error;

    } catch(e: any) {
        console.log('Unable to serialize error', e);
        return {
            error: e?.name || "InternalServerError",
            message: e?.message || "",
            status: 500
        };

    }
}
