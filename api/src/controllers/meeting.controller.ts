import { Request, Response, NextFunction } from 'express';
import { CreateMeetingParams} from '../middleware/validators/create.meeting.validator.js';
import meetingService from '../services/meeting.service.js';
import { GenerateUploadPresignBody } from '../middleware/validators/meeting.generate.presign.validator.js';
import { User } from '../../generated/prisma/index.js';
import { APIError } from '../middleware/error.middleware.js';


export async function createMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User ?? null;
        if(!user || !user.id)
            throw new APIError(401, 'unauthenticated request');
    const createMeetingParams = req.body as CreateMeetingParams;
    const data = await meetingService.create(user.id, createMeetingParams);
    return res.status(201).json({ message: 'Meeting created successfully', data });
  } catch (error) {
    next(error);
  }
}

export async function getUserMeetings(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User ?? null;
        if(!user || !user.id)
            throw new APIError(401, 'unauthenticated request');
    const data = await meetingService.getAll(user.id);
    return res.status(200).json({ message: 'User meetings fetched successfully', data });
  } catch (error) {
    next(error);
  }
}


export async function getUserMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User ?? null;
        if(!user || !user.id)
            throw new APIError(401, 'unauthenticated request');
    const meetingUuid = req.params.uuid ?? '';
    if (!meetingUuid || typeof meetingUuid !== 'string') {
      throw new APIError(404, 'Invalid meeting id');
    }
    const data = await meetingService.getByUuid(meetingUuid, user.id);
    return res.status(200).json({ message: 'User meeting fetched successfully', data });
  } catch (error) {
    next(error);
  }
}

export async function generateMeetingUploadPresignParams(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req.user as User) ?? null;
    if (!user || !user.id) {
      throw new APIError(401, 'unauthenticated request');
    }

    const meetingUuid = req.params.uuid ?? '';
    if (!meetingUuid || typeof meetingUuid !== 'string') {
      throw new APIError(404, 'Invalid meeting id');
    }

    const uploadParams = req.body as GenerateUploadPresignBody;
    const data = await meetingService.generateUploadPresignParams(meetingUuid, user.id, uploadParams);

    return res.status(201).json({ message: 'presigned upload URL generated successfully', data });
  } catch (error) {
    next(error);
  }
}


export async function getMeetingNoteStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req.user as User) ?? null;
    if (!user || !user.id) {
      throw new APIError(401, 'unauthenticated request');
    }

    const meetingUuid = req.params.uuid ?? '';
    if (!meetingUuid || typeof meetingUuid !== 'string') {
      throw new APIError(404, 'Invalid meeting id');
    }

    const data = await meetingService.getNoteStatus(meetingUuid, user.id);

    return res.status(201).json({ message: 'fetched successfully', data });
  } catch (error) {
    next(error);
  }
}

export async function getMeetingTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req.user as User) ?? null;
    if (!user || !user.id) {
      throw new APIError(401, 'unauthenticated request');
    }

    const meetingUuid = req.params.uuid ?? '';
    if (!meetingUuid || typeof meetingUuid !== 'string') {
      throw new APIError(404, 'Invalid meeting id');
    }

    const data = await meetingService.getTranscript(meetingUuid, user.id);

    return res.status(201).json({ message: 'fetched successfully', data });
  } catch (error) {
    next(error);
  }
}
