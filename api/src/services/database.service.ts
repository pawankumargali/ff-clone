// import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '../../generated/prisma/client.js'


const db = new PrismaClient({
    log: [
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' }
    ]
});

db.$on('info', (e) => console.info('[prisma:info]', e.message));
db.$on('warn', (e) => console.warn('[prisma:warn]', e.message));
db.$on('error', (e) => console.error('[prisma:error]', e.message));

export default db;
