import { Express } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import db from '../services/database.service.js';
import { APIError } from '../middleware/error.middleware.js'
import config from '../../config.js';

export default function initPassport(app: Express): void {
    app.use(passport.initialize());
    passport.use(jwtStrategy);
    passport.use(googleStrategy);
}


const jwtStrategy = new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.JWT_SECRET
}, 
async (jwt_payload, done) => {
    try {

        const { id: userId, emailId } = jwt_payload;
        const filter: any = {};
        if(userId)
            filter.id = userId;
        else if(emailId)
            filter.emailId = emailId;
        const user = await db.user.findFirst({ where: filter });
        
        if(!user) 
            return done(new APIError(404, 'user not found'), false);
        
        return done(null, user);
    }
    catch(error) {
        console.log(error);
        return done(error, false);
    }
});


const googleStrategy = new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/v1/auth/google/redirect',
    proxy: true
}, 
async (_accessToken, _refreshToken, userData, done) => {
    try {
        const { 
            sub: googleUserId, 
            given_name: firstName, 
            family_name: lastName, 
            picture: profilePic, 
            email: emailId, 
            email_verified
        } = userData._json;
        console.log(userData);
        console.log('USER DATA HERE');
        console.log(userData._json);
        
        let  user = await db.user.findFirst({ 
            where: { emailId: emailId}
        });
        if(!user) {
            if(!emailId || !firstName) 
                throw new APIError(500, "emailId & firstName are required");
            user = await db.user.create({
                data: {
                    emailId: emailId,
                    firstName: firstName,
                    lastName: lastName ?? "", 
                    profilePic: profilePic ?? "", 
                    sub: googleUserId,
                    emailVerified: email_verified ?? false
                }
            });
            console.log('USER CREATED HERE');
            console.log(user); 
        }
        console.log('REACHED _HERE NO PROBLEM');
        return done(null, user);
    } 
    catch(error) {
        console.log('OH NO ERROR ENTRY');
        console.log(error);
        return done(error);
    }
});