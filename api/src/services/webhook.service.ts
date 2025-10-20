import { APIError } from '../middleware/error.middleware.js';
import db from './database.service.js';
import { WebhookBodyParams } from '../middleware/validators/webhook.body.validator.js';
import summarizerService from './summarizer.service.js';
import { MeetingNoteStatus } from '@prisma/client';

class WebhookService {

    async handleEvent(
        meetingUuid: string,
        params: WebhookBodyParams
    ) {
        try {
            console.log('WEBHOOK_TRIGGERED');
            console.log(params);

            const exists = await db.meeting.findFirst({
                where: { uuid: meetingUuid }
            })

            if(!exists) {
                throw new APIError(404, `Meeting id ${meetingUuid} not found.`);
            }
            delete params.message;
            await db.meeting.update({
                where: { id: exists.id },
                data: params

            });

            if(params.noteStatus==MeetingNoteStatus.TRANSCRIBED) {
                console.log('Timeout Start');
                setTimeout(async () => {
                try {
                    await summarizerService.summarize(meetingUuid) 
                } catch(e) {
                    console.log('summarize failed', e);
                }
                    console.log('Timeout End')
                }, 60_000);
            }

            return null; 

        } catch (e) {
            throw e;
        }
    }
}

export default new WebhookService();
