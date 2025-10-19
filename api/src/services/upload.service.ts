import { createUploadPresignedPost} from "../utils/aws.s3.util.js";
import {AllowedAudioTypes, EXT_BY_MIME, GenerateUploadPresignBody} from '../middleware/validators/meeting.generate.presign.validator.js'
import { generateRandomUUID, slugify } from "../utils/string.util.js";

export async function createMeetingUploadPresignedUrl(
  params: GenerateUploadPresignBody & {
  meetingUuid: string;
  userId: number;
}) {

  slugify
  const { meetingUuid, userId, contentType, fileName } = params;
  const ext = EXT_BY_MIME[contentType] ?? "bin";
  const safeBase = slugify(params.fileName).slice(0, 100)

  // per-user private prefix; your read APIs should enforce userId === caller.id
  const key = `${meetingUuid}/${safeBase}${Date.now()}.${ext}`;

  const data = await createUploadPresignedPost(
    userId,
    {
      key,
      contentType
    }
  );

  console.log(data);

  const res = Object.assign({}, data, { allowed: AllowedAudioTypes })
  return res;
}
