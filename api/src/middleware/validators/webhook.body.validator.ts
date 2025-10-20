import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { MeetingNoteStatus } from '@prisma/client';


export const WebhookBodyParamsSchema = z.object({
  noteStatus: z.enum(MeetingNoteStatus),
  message: z.string().optional(),
  audioKey: z.string().optional(),
  audioUrl: z.string().optional(),
  transcriptKey: z.string().optional(),
  transcriptUrl: z.string().optional()
});

export type WebhookBodyParams = z.infer<typeof WebhookBodyParamsSchema>;

export function validateWebhookBodyParams(req: Request, _: Response, next: NextFunction) {
    try {
        const validatedBody = WebhookBodyParamsSchema.parse(req.body);
        req.body = validatedBody;
        next();
    } catch (error) {
        next(error);
    }
}
