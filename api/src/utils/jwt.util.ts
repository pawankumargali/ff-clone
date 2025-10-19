import jwt from 'jsonwebtoken';
import { User } from '../../generated/prisma/index.js';


export function generateToken(payload: Partial<User>, secret:string, expiry: number): string {
    const token = jwt.sign(payload, secret, { expiresIn: expiry });
    return token;
}

export function verifyToken(token: string, secret: string): any {
    const decoded =  jwt.verify(token, secret);
    return decoded;
}