const region = process.env.REGION || "ap-south-1";
const webhookDomainName = process.env.WEBHOOK_DOMAIN_NAME || "";
const webhookSecret = process.env.WEBHOOK_SECRET || "";

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

    if (!webhookDomainName || !webhookSecret || !region) {
      console.warn('Skipping record: missing required envs (webhook config).', {
        hasWebhookDomain: !!webhookDomainName,
        hasWebhookSecret: !!webhookSecret,
        hasRegion: !!region
      });
      return { skipped: true, reason: 'missing envs' };
    }

    const meetingUuid = key.split('/')?.[0]?.trim();
    if (!meetingUuid) {
      console.warn('Skipping record: could not derive meetingUuid from key', { key });
      return { skipped: true, reason: 'no meetingUuid' };
    }


    try {
      // 1) Mark transcribed
      console.log('transcribe_webhook_payload',  {
            noteStatus: 'TRANSCRIBED',
            message: 'transcribe successful',
      });
      {
        const res = await fetch(`${webhookDomainName}/api/v1/webhook/${meetingUuid}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-webhook-secret': webhookSecret,
          },
          body: JSON.stringify({
            noteStatus: 'TRANSCRIBED',
            message: 'transcribe successful',
          }),
        });
        if (!res.ok) {
          console.warn('Webhook TRANSCRIBED returned non-2xx', { status: res.status });
          return;
        }
      }

      return { ok: true  };
    } catch (error) {
      console.error('Failed to update transcred & status', {
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
