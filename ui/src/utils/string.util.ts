import type { Meeting } from "./types.util";
import { v4 as uuidv4 } from 'uuid';


export function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function generateRandomUUID() {
  return uuidv4();
}

 export  const defaultMeetings: Meeting[] = [
  {
    uuid: "a1b2c3d4",
    title: "Weekly Sync with Product",
    link: "Roadmap & priorities",
    noteStatus: "TRANSCRIBED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uuid: "e5f6g7h8",
    title: "Customer Call - ACME Corp",
    link: null,
    noteStatus: "SUMMARIZING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uuid: "i9j0k1l2",
    title: "Design Review",
    link: "Recording uploaded; awaiting transcript",
    noteStatus: "TRANSCRIBING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];