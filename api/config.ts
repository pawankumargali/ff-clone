import dotenv from 'dotenv';
import { SIXTY_MB } from './src/utils/constants.util.js';
dotenv.config();

const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 8081,
  RATE_LIMIT_RPM: process.env.RATE_LIMIT_RPM ? Number(process.env.RATE_LIMIT_RPM) : 60,
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET ?? "",
  FE_DOMAIN_NAME: process.env.FE_DOMAIN_NAME ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "", 
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  REDIS: {
    URL: process.env.REDIS_URL ?? 'redis://localhost:6379'
  },
  AWS: {
    S3: {
      REGION: process.env.AWS_REGION || 'ap-south-1',
      BUCKET: process.env.S3_BUCKET || "dev-bucket",
      EXPIRE: 1*60*60, //in seconds
      MAX_BYTES: SIXTY_MB,
      TRANSCRIPT_BUCKET: process.env.S3_TRANSCRIPT_BUCKET || "dev-bucket"
    }
    
  },
  TRANSCRIBE: {
    REGION: process.env.AWS_REGION || 'ap-south-1',
    LANGUAGE_CODE: process.env.TRANSCRIBE_LANGUAGE_CODE ?? 'en-US',
    MEDIA_FORMAT: process.env.TRANSCRIBE_MEDIA_FORMAT ?? 'wav',
    POLL_INTERVAL_MS: Number(process.env.TRANSCRIBE_POLL_INTERVAL_MS ?? 30_000)
  },
  OPENAI_API_KEY:  process.env.OPENAI_API_KEY || ""
}

export default config;
