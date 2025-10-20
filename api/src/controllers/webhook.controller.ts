import { Request, Response, NextFunction } from 'express';
import webhookService from '../services/webhook.service.js';
import { APIError } from '../middleware/error.middleware.js';
import { WebhookBodyParams } from '../middleware/validators/webhook.body.validator.js';


export async function handleWebhookEvt(req: Request, res: Response, next: NextFunction) {
  try {
    const meetingUuid = req.params.meetingUuid ?? '';
    console.log('MEETING_UUID')
    console.log(meetingUuid);
    if (!meetingUuid || typeof meetingUuid !== 'string') {
      throw new APIError(404, 'Invalid meeting uuid');
    }
    console.log('IN_CONTROLLER');
    console.log(req.body);
    const webhookBodyParams = req.body as WebhookBodyParams;
    const data = await webhookService.handleEvent(meetingUuid, webhookBodyParams);
    return res.status(200).json({ message: 'event processed successfully', data });
  } catch (error) {
    next(error);
  }
}