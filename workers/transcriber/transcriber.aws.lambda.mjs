import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import * as path from 'path';

const region = process.env.AWS_REGION || process.env.REGION || 'ap-south-1';
const transcribe = new TranscribeClient({ region });

const languageCode = 'en-US';
const outputBucket = process.env.TRANSCRIBE_OUTPUT_BUCKET;
const webhookDomainName = process.env.WEBHOOK_DOMAIN_NAME;
const webhookSecret = process.env.WEBHOOK_SECRET;

const mediaFormatAliases = new Map([
  ['.mp3', 'mp3'],
  ['.mpeg', 'mp3'],
  ['.mp4', 'mp4'],
  ['.m4a', 'mp4'],
  ['.wav', 'wav'],
  ['.ogg', 'ogg'],
  ['.webm', 'webm'],
  ['.flac', 'flac'],
  ['.amr', 'amr'],
]);

const getMediaFormatFromKey = (key) => {
  if (!key) return undefined;
  return mediaFormatAliases.get(path.extname(key).toLowerCase());
};

const sanitizeForJobName = (value) =>
  value.replace(/\s+/g, '-').replace(/[^A-Za-z0-9\-_.]/g, '');

const buildJobName = (key) => {
  const sanitized = sanitizeForJobName(`${key}`);
  const suffix = `${Date.now()}`;
  const maxBaseLength = Math.max(1, 200 - suffix.length - 1);
  const base = sanitized.slice(0, maxBaseLength) || 'job';
  return `${base}-${suffix}`;
};

export const handler = async (event) => {
  console.info('Invoking handler');
  if (!event?.Records?.length) {
    console.warn('Received S3 event with no records');
    return { ok: true, processed: 0 };
  }

  const tasks = event.Records.map(async (record) => {
    const bucket = record?.s3?.bucket?.name;
    const key = record?.s3?.object?.key;

    if (!bucket || !key) {
      console.warn('Skipping record without bucket/key', record);
      return { skipped: true, reason: 'no bucket/key' };
    }

    if (!outputBucket || !webhookDomainName || !webhookSecret) {
      console.warn('Skipping record: missing required envs (output bucket/prefix or webhook config).', {
        hasOutputBucket: !!outputBucket,
        hasWebhookDomain: !!webhookDomainName,
        hasWebhookSecret: !!webhookSecret,
      });
      return { skipped: true, reason: 'missing envs' };
    }

    const meetingUuid = key.split('/')?.[0]?.trim();
    if (!meetingUuid) {
      console.warn('Skipping record: could not derive meetingUuid from key', { key });
      return { skipped: true, reason: 'no meetingUuid' };
    }

    const decodedKey = decodeURIComponent(key.replace(/\+/g, ' '));
    const mediaFileUri = `s3://${bucket}/${decodedKey}`;
    const transcriptionJobName = buildJobName(decodedKey);
    const mediaFormat = getMediaFormatFromKey(decodedKey);

    console.log(JSON.stringify({
      log: 'PARAMS',
      evt: event,
      constructed: { decodedKey, mediaFileUri, transcriptionJobName, mediaFormat },
      env: { outputBucket, region },
    }));

    if (!mediaFormat) {
      console.warn('Skipping record with unsupported media format', { bucket, key: decodedKey });
      return { skipped: true, reason: 'unsupported format' };
    }

    const outputPrefix = `${meetingUuid}/`;
    const audioUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
    const transcriptKey = `${outputPrefix}${transcriptionJobName}.json`;
    const transcriptUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(transcriptKey)}`;

    try {
      // 1) Mark recorded
      {
        const res = await fetch(`${webhookDomainName}/api/v1/webhook/${meetingUuid}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-webhook-secret': webhookSecret,
          },
          body: JSON.stringify({
            audioKey: key,
            audioUrl,
            transcriptKey,
            transcriptUrl,
            noteStatus: 'RECORDED',
            message: 'upload success',
          }),
        });
        if (!res.ok) {
          console.warn('Webhook RECORDED returned non-2xx', { status: res.status });
          return;
        }
      }

      //2) Start Transcription Job
      console.info('Starting transcription job', {
        transcriptionJobName,
        mediaFileUri,
        outputBucket
      });

      await transcribe.send(
        new StartTranscriptionJobCommand({
          TranscriptionJobName: transcriptionJobName,
          Media: { MediaFileUri: mediaFileUri },
          MediaFormat: mediaFormat,
          LanguageCode: languageCode,
          OutputBucketName: outputBucket,
          OutputKey: outputPrefix,
          Settings: {
            ShowSpeakerLabels: true,
            MaxSpeakerLabels: 5
          },
        }),
      );

      return { ok: true, job: transcriptionJobName };
    } catch (error) {
      if (error?.name === 'ConflictException') {
        console.warn('Transcription job already exists, skipping', {
          transcriptionJobName,
          message: error.message,
        });
        return { skipped: true, reason: 'conflict' };
      }
      console.error('Failed to start transcription job', {
        transcriptionJobName,
        mediaFileUri,
        error: error.stack || error,
      });
      throw error;
    }
  });

  // Don’t fail entire batch if one record fails (better for dev)
  const settled = await Promise.allSettled(tasks);
  console.log('Batch result:', JSON.stringify(settled));
  console.info('exiting handler');
  return { ok: true };
};
