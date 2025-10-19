import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SIXTY_MB } from '../../utils/constants.util.js';

export const AllowedAudioTypes=[
    "audio/webm",
    "audio/mpeg",
    "audio/mp4",   
    "audio/x-m4a",
    "audio/wav",
    "audio/ogg",
];


// map MIME → file extension
export const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",   // commonly m4a for audio/mp4
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
};

export const GenerateUploadPresignBodySchema = z.object({
  contentType: z.enum(AllowedAudioTypes),
  fileName: z.string(),
  fileSize: z.number().lte(SIXTY_MB)
});

export type GenerateUploadPresignBody = z.infer<typeof GenerateUploadPresignBodySchema>;


export function validateGenerateUploadPresignBody(req: Request, _: Response, next: NextFunction) {
  try {
    const validatedBody = GenerateUploadPresignBodySchema.parse(req.body);
    req.body = validatedBody;
    next();
  } catch (error) {
    next(error);
  }
}
