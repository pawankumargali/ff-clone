import { Router } from 'express';
import {
 LoginUserOAuth,
 RedirectToAppLoginURL
} from '../controllers/auth.controller.js';
import verifyAuth from '../middleware/auth.middleware.js'

const router = Router();

router.get('/v1/auth/google', verifyAuth.google);
router.get('/v1/auth/google/redirect', verifyAuth.googleRedirect, LoginUserOAuth);
router.get('/v1/auth/fail', RedirectToAppLoginURL);

export default router;
