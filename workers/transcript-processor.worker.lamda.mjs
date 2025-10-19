import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Readable } from 'node:stream';

const region = process.env.REGION;
const webhookUrl = process.env.TRANSCRIPT_WEBHOOK_URL;
const webhookApiKey = process.env.TRANSCRIPT_WEBHOOK_API_KEY;
const bedrockModelId = process.env.BEDROCK_MODEL_ID;

const s3 = new S3Client({ region });
const bedrock = bedrockModelId ? new BedrockRuntimeClient({ region }) : undefined;

const streamToString = async (body) => {
  if (!body) {
    return '';
  }

  if (typeof body === 'string') {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body).toString('utf-8');
  }

  if (typeof body.transformToString === 'function') {
    return body.transformToString('utf-8');
  }

  const stream = body instanceof Readable ? body : Readable.from(body);

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf-8');
};

const extractTranscriptText = (transcriptJson) => {
  const direct = transcriptJson?.results?.transcripts?.[0]?.transcript;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  const segments = transcriptJson?.results?.items?.filter((item) => item?.type === 'pronunciation');
  if (segments?.length) {
    return segments
      .map((segment) => segment?.alternatives?.[0]?.content)
      .filter(Boolean)
      .join(' ');
  }

  return '';
};

const summarizeTranscript = async (transcriptText) => {
  if (!bedrock || !bedrockModelId) {
    throw new Error('BEDROCK_MODEL_ID must be configured for summarization.');
  }

  if (!transcriptText) {
    throw new Error('Transcript text is empty; cannot summarize.');
  }

  const payload = {
    inputText: `Summarize the following meeting transcript. Provide 3-5 concise bullet points highlighting key decisions, action items, and blockers.\n\nTranscript:\n${transcriptText}`,
    textGenerationConfig: {
      maxTokenCount: 512,
      temperature: 0.2,
      topP: 0.9,
      topK: 50,
    },
  };

  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: bedrockModelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    }),
  );

  const responseBody = await streamToString(response.body);
  const data = JSON.parse(responseBody);
  const summary = data?.results?.[0]?.outputText?.trim();

  if (!summary) {
    throw new Error('Bedrock summarization response did not include outputText.');
  }

  return {
    summary,
    rawResponse: data,
  };
};

const postTranscriptWebhook = async (record, transcriptUrl) => {
  if (!webhookUrl) {
    throw new Error('TRANSCRIPT_WEBHOOK_URL must be configured.');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (webhookApiKey) {
    headers.Authorization = `Bearer ${webhookApiKey}`;
  }

  const payload = {
    transcriptUrl,
    bucket: record?.s3?.bucket?.name,
    objectKey: record?.s3?.object?.key,
    region,
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '<unavailable>');
    throw new Error(`Webhook responded with HTTP ${response.status}: ${errorBody}`);
  }

  console.info('Posted transcript webhook', {
    bucket: record?.s3?.bucket?.name,
    key: record?.s3?.object?.key,
    transcriptUrl,
  });
};

const processRecord = async (record) => {
  const bucket = record?.s3?.bucket?.name;
  const key = record?.s3?.object?.key;

  if (!bucket || !key) {
    console.warn('Skipping record without bucket/key', record);
    return;
  }

  const decodedKey = decodeURIComponent(key.replace(/\+/g, ' '));
  const s3Uri = `s3://${bucket}/${decodedKey}`;
  const regionSegment = region ? `.${region}` : '';
  const httpsUrl = `https://${bucket}.s3${regionSegment ? regionSegment : ''}.amazonaws.com/${encodeURI(
    decodedKey,
  ).replace(/#/g, '%23')}`;

  try {
    const transcriptObject = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: decodedKey,
      }),
    );

    const transcriptBody = await streamToString(transcriptObject.Body);
    const transcriptJson = JSON.parse(transcriptBody);
    const transcriptText = extractTranscriptText(transcriptJson);

    await postTranscriptWebhook(record, httpsUrl);
    const summaryResponse = await summarizeTranscript(transcriptText);

    console.info('Triggered transcript summarization job', {
      bucket,
      key: decodedKey,
      transcriptUrl: httpsUrl,
      bedrockModelId,
      summaryLength: summaryResponse?.summary?.length,
    });

    return summaryResponse;
  } catch (error) {
    console.error('Failed processing transcript record', {
      bucket,
      key: decodedKey,
      error: error.stack || error,
    });
    throw error;
  }
};

export const handler = async (event) => {
  if (!event?.Records?.length) {
    console.warn('Received S3 event with no records');
    return;
  }

  await Promise.all(event.Records.map((record) => processRecord(record)));
};
