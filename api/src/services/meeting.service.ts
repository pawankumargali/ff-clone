import { APIError } from '../middleware/error.middleware.js';
import { generateRandomUUID, slugify } from '../utils/string.util.js';
import { CreateMeetingParams } from '../middleware/validators/create.meeting.validator.js';
import { Meeting, MeetingNoteStatus } from '@prisma/client';
import db from './database.service.js';
import { createMeetingUploadPresignedUrl } from './upload.service.js';
import { GenerateUploadPresignBody } from '../middleware/validators/meeting.generate.presign.validator.js';
import { readJsonFromS3 } from '../utils/aws.s3.util.js';
import config from '../../config.js';

class MeetingService {

    async create(userId: number, createMeetingParams: CreateMeetingParams): Promise<Partial<Meeting>> {
        try {
            const { title, link } = createMeetingParams;
            const uuid = generateRandomUUID();

            const slug = slugify(title);
            const existing = await db.meeting.findFirst({
                where: { slug, userId }
            });

            if(existing)
                throw new APIError(400, `meeting with title similar to title exists - ${existing.title}`);

            // Create meeting
            const meeting = await db.meeting.create({
                data: {
                    userId: userId,
                    title,
                    link: link ?? "",
                    slug: slugify(title),
                    noteStatus: MeetingNoteStatus.NONE,
                    uuid
                },
                select: { uuid: true, title: true, noteStatus: true, createdAt: true, updatedAt: true },
            });

            return meeting;

        } catch(e) {
            throw e;
        }
    }

    async getAll(userId: number): Promise<Array<Meeting>> {
        try {
            const data = await db.meeting.findMany({
                where: {
                    userId,
                    noteStatus: {
                        notIn: [ 
                            // MeetingNoteStatus.
                            MeetingNoteStatus.FAILED
                        ]
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return data;
        } catch(e) {
            throw e;
        }
    }

    async getByUuid(uuid: string) {
        try {
            const meeting = await db.meeting.findUnique({
                where: {
                    uuid
                }
            });
            if(!meeting)
                throw new APIError(404, 'meeting not found');
            return meeting;
        } catch(e) {
            throw e;
        }
    }

    async generateUploadPresignParams(
        uuid: string,
        userId: number,
        params: GenerateUploadPresignBody
    ) {
        try {
            const meeting = await db.meeting.findFirst({
                where: {
                    uuid,
                    userId
                }
            });

            if (!meeting) {
                throw new APIError(404, 'meeting not found');
            }   

            // if meeting already recorded then throw error
            if (meeting.noteStatus != MeetingNoteStatus.NONE && meeting.noteStatus !== MeetingNoteStatus.RECORDING) {
                throw new APIError(400, `cannot upload audio for meeting. meeting notes are already ${meeting.noteStatus}`);
            }

            const uploadParams = await createMeetingUploadPresignedUrl({
                meetingUuid: uuid,
                userId,
                contentType: params.contentType,
                fileName: params.fileName,
                fileSize: params.fileSize
            });

            const audioKey = uploadParams.fields['key'];
            const updatedMeeting = await db.meeting.update({
                where: { uuid },
                data: {
                    noteStatus: MeetingNoteStatus.RECORDING,
                    audioKey,
                    audioUrl: `${uploadParams.url}/${audioKey}`
                }
            });

            return {
                meeting: {
                    uuid: updatedMeeting.uuid,
                    noteStatus: updatedMeeting.noteStatus,
                    updatedAt: updatedMeeting.updatedAt,
                },
                uploadParams
            };
        } catch (e) {
            throw e;
        }
    }

    async getNoteStatus(meetingUuid: string, userId: number) {
        try {
            const exists = await db.meeting.findFirst({
                where: { uuid: meetingUuid, userId }
            });
            if(!exists)
                throw new APIError(404, 'user meeting not found');
            return { 
                status: exists.noteStatus
            }
        } catch(e) {
            throw e;
        }
    }


    async getTranscript(meetingUuid: string, userId: number) {
        try {
            const exists = await db.meeting.findFirst({
                where: { uuid: meetingUuid, userId }
            });
            if(!exists)
                throw new APIError(404, 'user meeting not found');
            const noteStatus = exists.noteStatus;
            const acceptedNoteStatuses: MeetingNoteStatus[] = [
                MeetingNoteStatus.TRANSCRIBED,
                MeetingNoteStatus.SUMMARIZED
            ]
            if(!acceptedNoteStatuses.includes(noteStatus))
                throw new APIError(400, 'meeting not yet transcribed');

            if(!exists.transcriptKey) 
                throw new APIError(500, 'internal server error. please try again');
            const transcriptData = await readJsonFromS3(config.AWS.S3.TRANSCRIPT_BUCKET, exists.transcriptKey) as { status: string; results: any };
            console.log(typeof transcriptData);
            if(transcriptData.status!='COMPLETED')
                throw new APIError(500, 'internal server error. please try again');

            return transcriptData.results

        } catch(e) {
            throw e;
        }
    }

}

export default new MeetingService();
