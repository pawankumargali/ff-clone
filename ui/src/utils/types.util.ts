export type NotesStatus =
  | "NONE"
  | "RECORDING"
  | "RECORDED"
  | "TRANSCRIBED"
  | "SUMMARIZED"
  | "FAILED"

export type Meeting = {
  uuid: string;
  title: string;
  noteStatus: NotesStatus;
  link?: string | null;
  summaryJson?: unknown;
  summaryRawText?: string | null;
  summary?: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};

export interface MeetingTranscriptAlternative {
  confidence: string;
  content: string;
}

export interface MeetingTranscriptItem {
  id: number;
  type: string;
  alternatives: MeetingTranscriptAlternative[];
  start_time?: string;
  end_time?: string;
  speaker_label?: string;
}

export interface MeetingTranscriptSpeakerItem {
  speaker_label: string;
  start_time: string;
  end_time: string;
}

export interface MeetingTranscriptSpeakerSegment {
  start_time: string;
  end_time: string;
  speaker_label: string;
  items: MeetingTranscriptSpeakerItem[];
}

export interface MeetingTranscriptSegment {
  id: number;
  transcript: string;
  start_time: string;
  end_time: string;
  speaker_label: string;
  items: number[];
}

export interface MeetingTranscript {
  transcripts?: Array<{ transcript: string }>;
  speaker_labels?: {
    segments: MeetingTranscriptSpeakerSegment[];
    channel_label?: string;
    speakers?: number;
  };
  items?: MeetingTranscriptItem[];
  audio_segments?: MeetingTranscriptSegment[];
}

export interface MeetingSummaryKeyInsight {
  headline: string;
  detail: string;
  evidence: string[];
}

export interface MeetingSummaryActionItem {
  assignee: string;
  task: string;
  due_date: string | null;
  priority: "P0" | "P1" | "P2" | null;
  confidence: number;
  evidence: string[];
}

export interface MeetingSummary {
  summary: string;
  key_insights: MeetingSummaryKeyInsight[];
  action_items: MeetingSummaryActionItem[];
}



export type MeetingNoteStatus =
  | "NONE"
  | "RECORDING"
  | "RECORDED"
  | "TRANSCRIBED"
  | "SUMMARIZED"
  | "FAILED"


export type PresignPost =
  | { url: string; fields: Record<string, string>; key?: string } // POST
  | { uploadUrl: string; objectKey: string }; // PUT



export interface APICreateMeetingResponse {
  message: string;
  data: {
    uuid: string;
    title: string;
    noteStatus: MeetingNoteStatus;
    createdAt: string; //ISO Date String
    updatedAt: string; // ISO Date String
  }
}

export interface APIGenerateUploadPresignedUrlResponse {
  message: string;
  data: {
    meeting: {
      id: number;
      uuid: number;
      status: MeetingNoteStatus;
    },
    uploadParams: {
      url: string;
      fields: Record<string, string>;
      key: string;
      expiresInSeconds: number;
      maxBytes: number;
      allowed: string []; // allowed media types for upload
    }
  } 
}
