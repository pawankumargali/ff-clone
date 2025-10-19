import { Router } from 'express';
import verifyAuth from '../middleware/auth.middleware.js';
import { validateWebhookBodyParams } from '../middleware/validators/webhook.body.validator.js';
import { handleWebhookEvt } from '../controllers/webhook.controller.js';

const router = Router();

router.post(
    '/v1/webhook/:meetingUuid', 
    verifyAuth.webhook, 
    validateWebhookBodyParams,
    handleWebhookEvt
);

export default router;
