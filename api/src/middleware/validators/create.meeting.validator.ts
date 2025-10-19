import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const CreateMeetingInputSchema = z.object({
  title: z.string().trim().min(5).max(160),
  link: z.string().optional()
});

export type CreateMeetingParams = z.infer<typeof CreateMeetingInputSchema>;

export function validateCreateMeetingInput(req: Request, _: Response, next: NextFunction) {
    try {
        const validatedBody = CreateMeetingInputSchema.parse(req.body);
        req.body = validatedBody;
        next();
    } catch (error) {
        next(error);
    }
}
