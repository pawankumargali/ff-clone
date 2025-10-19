import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config  from '../config.js';
import initRoutes from './routes/index.router.js';
import { initErrorHandler, serializeError } from './middleware/error.middleware.js';
import { initLogger } from './middleware/logger.middleware.js';
import initPassport from './utils/passport.util.js';
import db from './services/database.service.js';

const app = express();

/* security + JSON */
app.use(helmet());
// app.enable('trust proxy');
app.disable('x-powered-by');
app.use(express.json());
app.use(cors());

/* rate-limiter */
app.use(
  '/',
  rateLimit({
    windowMs: 60_000,             // 1 min
    max: config.RATE_LIMIT_RPM,          // 30 req/min
    standardHeaders: true,
    legacyHeaders: false
  })
);

(async function () {
  try {
    await db.$connect();
    initLogger(app);
    initRoutes(app);
    initPassport(app);
    initErrorHandler(app);
    app.listen(config.PORT, () => {
      console.log(`-> API service listening on :${config.PORT}`);
    });
  } catch (error) {
    console.error(serializeError(error));
    process.exit(1);
  }
})();

