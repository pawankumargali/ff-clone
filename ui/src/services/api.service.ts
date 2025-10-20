import axios, { type AxiosResponse } from "axios";
import type { APICreateMeetingResponse, APIGenerateUploadPresignedUrlResponse } from "../utils/types.util";
import handleError from "../utils/error.util";


// export const BASE_URL = 'http://localhost:8081';
export const BASE_URL = 'https://ff-api.pawan.fyi';


export const API_ENDPOINTS = {
    GOOGLE_LOGIN: `${BASE_URL}/api/v1/auth/google`,
    GET_USER_MEETINGS: `${BASE_URL}/api/v1/meetings`,
    GET_USER_MEETING_BY_UUID: `${BASE_URL}/api/v1/meetings/##uuid`,
    CREATE_MEETING: `${BASE_URL}/api/v1/meetings`,
    GENERATE_MEETING_PRESIGNED_URL: `${BASE_URL}/api/v1/meetings/##uuid/upload/presign`,
    GET_MEETING_TRANSCRIPT: `${BASE_URL}/api/v1/meetings/##uuid/transcript`,
    GET_MEETING_NOTES_STATUS: `${BASE_URL}/api/v1/meetings/##uuid/noteStatus`
}


const _getAuthTokenOrFail = () => {
    try {
        const token = localStorage.getItem("userToken") ?? undefined;
        if(!token)
            throw new Error('unable to retreive auth token');
        return token;
    } catch(e) {
        throw e;
    }
}

const _generateHeaders = (token: string) => {
    return  {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}


export async function getUserMeetings() {
    try {
        const authToken = _getAuthTokenOrFail();
        const res = await axios.get(
            API_ENDPOINTS.GET_USER_MEETINGS,
            {
                headers: _generateHeaders(authToken)
            }
        ) as AxiosResponse<any>;
        console.log(res.status, res.data);
        return res?.data?.data;
    } catch(e: any) {
       handleError(e)
    }
}

export async function getUserMeeting(meetingUuid: string) {
    try {
        const authToken = _getAuthTokenOrFail();
        const apiUrl = API_ENDPOINTS.GET_USER_MEETING_BY_UUID.replace('##uuid', meetingUuid);

        const res = await axios.get(
            apiUrl,
            {
                headers: _generateHeaders(authToken)
            }
        ) as AxiosResponse<any>;
        console.log(res.status, res.data);
        return res?.data?.data;
    } catch(e: any) {
       handleError(e)
    }
}


export async function getMeetingTranscript(meetingUuid: string) {
    try {
        const authToken = _getAuthTokenOrFail();
        const apiUrl = API_ENDPOINTS.GET_MEETING_TRANSCRIPT.replace('##uuid', meetingUuid);

        const res = await axios.get(
            apiUrl,
            {
                headers: _generateHeaders(authToken)
            }
        ) as AxiosResponse<any>;
        console.log(res.status, res.data);
        return res?.data?.data;
    } catch(e: any) {
       handleError(e)
    }
}


export async function getMeetingNotesStatus(meetingUuid: string) {
    try {
        const authToken = _getAuthTokenOrFail();
        const apiUrl = API_ENDPOINTS.GET_MEETING_NOTES_STATUS.replace('##uuid', meetingUuid);
        const res = await axios.get(
            apiUrl,
            {
                headers: _generateHeaders(authToken)
            }
        ) as AxiosResponse<any>;
        console.log(res.status, res.data);
        return res?.data?.data?.status;
    } catch(e: any) {
       handleError(e)
    }
}

export async function createMeeting(
  title: string,
  link?: string,
) {
  try {

    const authToken = _getAuthTokenOrFail();
        
    const res = await axios.post(
        API_ENDPOINTS.CREATE_MEETING,
      {
        title,
        link: link ?? ""
      },
      {
        headers: _generateHeaders(authToken)
      }
    ) as AxiosResponse<APICreateMeetingResponse>;
    console.log(res.status, res.data);
    return res?.data?.data;
  } catch (e) {
    handleError(e);
  }
}

export async function requestPresignPost(
  meetingUuid: string,
  fileInfo: {
  fileName: string;
  fileSize: number;
  contentType: string;
}) {
  try {
    const apiUrl = API_ENDPOINTS.GENERATE_MEETING_PRESIGNED_URL.replace('##uuid', meetingUuid);
    const authToken = _getAuthTokenOrFail();
    const res = await axios.post(
      apiUrl,
      fileInfo,
      {
        headers: _generateHeaders(authToken)
      }) as AxiosResponse<APIGenerateUploadPresignedUrlResponse>;
    console.log(res.status, res.data);
    return res?.data?.data;
  } catch (e) {
    handleError(e);
  }
}


export async function uploadWithPresignedPOST(
  params: { url: string; fields: Record<string, string>, payload: File },
  
  
) {
  try {
    const formData = new FormData();
  for (const [k, v] of Object.entries(params.fields)) formData.append(k, v);
  formData.append("file", params.payload);
  const res = await axios.post(
    params.url,  
    formData 
  );
  if (!(res.status >= 200 && res.status < 300)) {
    throw new Error(`S3 POST upload failed (${res.status})`);
  }
  // object key typically in fields.key
  return params.fields.key ?? "";
    
} catch (e) {
    handleError(e);
  }
}