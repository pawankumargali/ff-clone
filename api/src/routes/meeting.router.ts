import { Router } from 'express';
import { createMeeting, generateMeetingUploadPresignParams, getMeetingNoteStatus, getUserMeetings, getUserMeeting, getMeetingTranscript } from '../controllers/meeting.controller.js';
import verifyAuth from '../middleware/auth.middleware.js';
import { validateGenerateUploadPresignBody } from '../middleware/validators/meeting.generate.presign.validator.js';

const router = Router();

router.post('/v1/meetings', verifyAuth.jwt(), createMeeting);
router.get('/v1/meetings', verifyAuth.jwt(), getUserMeetings);
router.get('/v1/meetings/:uuid', verifyAuth.jwt(), getUserMeeting);
router.get('/v1/meetings/:uuid/noteStatus', verifyAuth.jwt(), getMeetingNoteStatus);
router.get('/v1/meetings/:uuid/transcript', verifyAuth.jwt(), getMeetingTranscript);
router.post(
  '/v1/meetings/:uuid/upload/presign',
  verifyAuth.jwt(),
  validateGenerateUploadPresignBody,
  generateMeetingUploadPresignParams
);



export default router;
