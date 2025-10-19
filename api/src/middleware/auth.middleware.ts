import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import config from '../../config.js';
import { APIError } from './error.middleware.js';

class Auth {

  google(req: Request, res: Response, next: NextFunction) {
    try {
      const authenticator = passport.authenticate('google', {
        scope: ['email', 'profile'],
        session: false
      });
      return authenticator(req, res, next);
    }
    catch(e) {
      console.log(e);
      next(e);
    }
  }

  googleRedirect(req: Request, res: Response, next: NextFunction) {
    try {
      const authenticator = passport.authenticate('google', {
        failureRedirect: '/api/v1/auth/fail',
        session: false,
      });
      return authenticator(req, res, next);
    }
    catch(e) {
      console.log(e);
      next(e);
    }
  }

  //call function in middleware to return passport method
  jwt() {
    return passport.authenticate('jwt', {
      session: false,
    });
  }

  webhook(req: Request, _: Response, next: NextFunction) {
    try {
      console.log('AUTH_T1');
      const webhookSecret = req.get('x-webhook-secret') ?? "";
      console.log('webhookSecret_in_header', webhookSecret);
      console.log('webhookSecret_in_config', config.WEBHOOK_SECRET);
      if(webhookSecret!=config.WEBHOOK_SECRET)
        throw new APIError(403, "forbidden request");
      next();
    } catch(e) {
      next(e);
    }
  }
}

export default new Auth();
