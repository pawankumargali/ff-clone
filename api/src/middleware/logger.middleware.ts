import { Request, Response, Express, NextFunction } from "express";

export function initLogger(app: Express) {
    app.use((req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        // Log incoming request
        console.log(JSON.stringify({
            type: "REQUEST",
            level: "INFO",
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
            timestamp: new Date().toISOString()
        }));

        // Capture the original res.json and res.send methods
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);

        let responseBody: any = null;

        // Override res.json to capture response body
        res.json = function(body: any) {
            responseBody = body;
            return originalJson(body);
        };

        // Override res.send to capture response body
        res.send = function(body: any) {
            if (!responseBody) {
                responseBody = body;
            }
            return originalSend(body);
        };

        // Log response when the response finishes
        res.on('finish', () => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            console.log(JSON.stringify({
                type: "RESPONSE",
                level: "INFO",
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
                    status: res.statusCode,
                    responseTime: `${responseTime}ms`,
                    contentType: res.getHeader('content-type'),
                    // body: responseBody
                },
                timestamp: new Date().toISOString()
            }));
        });

        next();
    });
}
