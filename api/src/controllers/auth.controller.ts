import { Request, Response, NextFunction } from 'express';
import { generateToken } from '../utils/jwt.util.js';
import { APIError } from '../middleware/error.middleware.js';
import config from '../../config.js'
import db from '../services/database.service.js'
import { User } from '@prisma/client';


export async function LoginUserOAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const reqUser = req.user as Partial<User>;
    if (!reqUser || !reqUser.emailId)
      return RedirectToAppLoginURL(req, res);
    const user = await db.user.findFirst({
      where: {
        emailId: reqUser.emailId
      }
    })
    
    if(!user)
      throw new APIError(403, 'forbidden');
    
    const TWENTY_FOUR_HRS = 24*60*60;
    const token = generateToken({
      id: user?.id,
      emailId: user.emailId,
    }, config.JWT_SECRET, TWENTY_FOUR_HRS);

    res.redirect(302, `${config.FE_DOMAIN_NAME}/auth/success?token=${token}`);
    return;

  } catch (error) {
    console.log(error);
    next(error);
  }
}

export function RedirectToAppLoginURL(_: Request, res: Response): void {
  res.redirect(307, `${config.FE_DOMAIN_NAME}/auth/login?error=auth-failed`);
  return;
}
