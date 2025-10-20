import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import "./MeetingDetails.css";
import Navbar from "../../components/Navbar/Navbar";
import type {
  NotesStatus,
  Meeting,
  MeetingTranscript,
  MeetingSummary,
  MeetingNoteStatus,
} from "../../utils/types.util";
import { getMeetingNotesStatus, getMeetingTranscript, getUserMeeting } from "../../services/api.service";

const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 60 * 60 * 1000;


export default function MeetingDetails() {
  const { uuid="" } = useParams<{ uuid: string }>();

  if(!uuid)
    return (
      <h3>Forbidden</h3>
    );

  const [meeting, setMeeting] = useState<Meeting | undefined>(undefined);
  const [meetingSummary, setMeetingSummary] = useState<MeetingSummary | null>(null);
  const [meetingTranscript, setMeetingTranscript] = useState<MeetingTranscript | null>(null);
  const [meetingNoteStatus, setMeetingNoteStatus] = useState<MeetingNoteStatus | null>(null);

  useEffect(() => {
    setMeeting(undefined);
    setMeetingSummary(null);
    setMeetingTranscript(null);
  }, [uuid]);

  const fetchMeeting = useCallback(async () => {
    try {
      if (!uuid) return;
      const meeting: Meeting = await getUserMeeting(uuid);
      setMeeting(meeting);
    } catch (e) {
      throw e;
    }
  }, [uuid]);

  const fetchMeetingTranscript = useCallback(async () => {
    try {
      if (!uuid) return;
      if (meetingTranscript) return;
      const transcriptData = await getMeetingTranscript(uuid);
      if (!transcriptData) {
        setMeetingTranscript(null);
        return;
      }

      if (typeof transcriptData === "string") {
        try {
          const parsed = JSON.parse(transcriptData) as MeetingTranscript;
          setMeetingTranscript(parsed);
        } catch (error) {
          console.error("Failed to parse transcript payload", error);
          setMeetingTranscript(null);
        }
        return;
      }

      setMeetingTranscript(transcriptData as MeetingTranscript);
    } catch (e) {
      throw e;
    }
  }, [meetingTranscript, uuid]);

  const fetchMeetingSummary = useCallback(async () => {
    try {
      if (!uuid) return;
      if (meetingSummary) return;
      const meetingData: Meeting = await getUserMeeting(uuid);
      setMeeting(meetingData);

      const rawSummary =
        meetingData.summaryJson ?? meetingData.summary ?? meetingData.summaryRawText;
      const normalized = normalizeMeetingSummaryPayload(rawSummary);
      setMeetingSummary(normalized);
    } catch (e) {
      console.error("Failed to fetch meeting summary", e);
      setMeetingSummary(null);
    }
  }, [meetingSummary, uuid]);


    const fetchMeetingNoteStatus = useCallback(async () => {
    try {
      if (!uuid) return;
      if (meetingNoteStatus=='SUMMARIZED' || meetingNoteStatus=='FAILED') return;
      const {noteStatus}: Meeting = await getMeetingNotesStatus(uuid);
      setMeetingNoteStatus(noteStatus);
    } catch (e) {
      console.error("Failed to fetch meeting summary", e);
      setMeetingSummary(null);
    }
  }, [meetingSummary, uuid]);


  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  useEffect(() => {
    fetchMeetingTranscript();
  }, [fetchMeetingTranscript]);

  useEffect(() => {
    fetchMeetingSummary();
  }, [fetchMeetingSummary]);

  useEffect(() => {
    fetchMeetingNoteStatus();
  }, [fetchMeetingNoteStatus]);

  useEffect(() => {
    if (!uuid || meetingSummary) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    const runPoll = async () => {
      if (cancelled || meetingSummary) return;
      try {
        const status = await getMeetingNotesStatus(uuid);
        setMeetingNoteStatus(status);
        if (cancelled) return;

        if (status === "FAILED") {
          return;
        }

        if (status === "TRANSCRIBED" || status === "SUMMARIZED") {
          await fetchMeetingTranscript();
        }

        if (status === "SUMMARIZED") {
          await fetchMeetingSummary();
          return;
        }
      } catch (error) {
        console.error("Failed to poll meeting status", error);
      }

      if (!cancelled && !meetingSummary && Date.now() < deadline) {
        timeoutId = window.setTimeout(runPoll, POLL_INTERVAL_MS);
      }
    };

    runPoll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [uuid, meetingSummary, fetchMeetingSummary, fetchMeetingTranscript]);

  const transcriptSegments = meetingTranscript?.audio_segments ?? [];
  const hasTranscriptSegments = transcriptSegments.length > 0;
  const hasSummaryContent =
    !!meetingSummary &&
    (meetingSummary.summary?.trim() ||
      meetingSummary.key_insights.length > 0 ||
      meetingSummary.action_items.length > 0);

  return (
    <main className="meet-root">
      <Navbar showBackBtn={true} />
      <header className="meet-header">
        <div className="left">
          <div className="titles">
            {meeting?.title && <h1 className="title">{meeting.title}</h1>}
            {meeting?.link && <p className="subtitle">{meeting.link || <span className="muted">-</span>}</p>}
          </div>
        </div>
        {meetingNoteStatus && <div className="right">
          <StatusPill status={meetingNoteStatus} />
        </div>}
      </header>

      <section className="dash-card meta">
        <div className="meta-grid">
          <div>
            <div className="meta-label">Status</div>
            {meetingNoteStatus && <div className="meta-value">{pretty(meetingNoteStatus)}</div>}
          </div>
          <div>
            <div className="meta-label">Created</div>
            {meeting?.createdAt && <div className="meta-value">{fmtDate(meeting.createdAt)}</div>}
          </div>
          <div>
            <div className="meta-label">Updated</div>
            {meeting?.updatedAt && <div className="meta-value">{fmtDate(meeting.updatedAt)}</div>}
          </div>
        </div>
      </section>

      {/* SIDE-BY-SIDE: SUMMARY (LEFT) & TRANSCRIPT (RIGHT) */}
      <div className="two-col">
        {/* SUMMARY */}
        <section className="dash-card section">
          <div className="section-head">
            <h2>Meeting Summary</h2>
          </div>
          {hasSummaryContent && meetingSummary && (
            <article className="scroll-box summary-feed">
              {meetingSummary.summary ? (
                <section className="summary-section">
                  <h3 className="summary-section-title">Overview</h3>
                  <p className="summary-overview">{meetingSummary.summary}</p>
                </section>
              ) : null}

              {meetingSummary.key_insights.length > 0 && (
                <section className="summary-section">
                  <h3 className="summary-section-title">Key Insights</h3>
                  <ol className="summary-list">
                    {meetingSummary.key_insights.map((insight, idx) => (
                      <li key={`${insight.headline}-${idx}`} className="summary-card">
                        <div className="summary-card-header">
                          <span className="summary-pill">{`Insight ${idx + 1}`}</span>
                          {insight.headline && (
                            <h4 className="summary-card-title">{insight.headline}</h4>
                          )}
                        </div>
                        {insight.detail && (
                          <p className="summary-card-body">{insight.detail}</p>
                        )}
                        {insight.evidence.length > 0 && (
                          <div className="summary-evidence">
                            <span className="summary-evidence-label">Evidence</span>
                            <ul>
                              {insight.evidence.map((entry, evidenceIdx) => (
                                <li key={`${insight.headline}-${evidenceIdx}`}>{entry}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {meetingSummary.action_items.length > 0 && (
                <section className="summary-section">
                  <h3 className="summary-section-title">Action Items</h3>
                  <ol className="summary-list">
                    {meetingSummary.action_items.map((item, idx) => (
                      <li key={`${item.task}-${idx}`} className="summary-card">
                        <div className="summary-card-header">
                          <span className="summary-pill">{`Action ${idx + 1}`}</span>
                          {item.assignee && (
                            <span className="summary-assignee">{item.assignee}</span>
                          )}
                        </div>
                        <p className="summary-card-body">{item.task}</p>
                        <div className="summary-meta">
                          <span>{`Due: ${formatDueDate(item.due_date)}`}</span>
                          <span>{`Priority: ${formatPriority(item.priority)}`}</span>
                          <span>{`Confidence: ${formatConfidence(item.confidence)}`}</span>
                        </div>
                        {item.evidence.length > 0 && (
                          <div className="summary-evidence">
                            <span className="summary-evidence-label">Evidence</span>
                            <ul>
                              {item.evidence.map((entry, evidenceIdx) => (
                                <li key={`${item.task}-${evidenceIdx}`}>{entry}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </article>
          )}
          {(!hasSummaryContent && meetingNoteStatus) && (
            <Placeholder
              label="Summary not ready yet"
              helper={statusHint(meetingNoteStatus, "summary")}
            />
          )}
        </section>

        {/* TRANSCRIPT */}
        <section className="dash-card section">
          <div className="section-head">
            <h2>Meeting Transcript</h2>
          </div>
          {hasTranscriptSegments && (
            <article className="scroll-box transcript-feed">
              {transcriptSegments.map((segment) => (
                <div
                  key={segment.id ?? `${segment.speaker_label}-${segment.start_time}`}
                  className="transcript-line"
                >
                  <span className="transcript-speaker">{formatSpeakerLabel(segment.speaker_label)}</span>
                  <span className="transcript-time">[{formatSegmentTime(segment.start_time)}]</span>
                  <span className="transcript-separator">:</span>
                  <span className="transcript-message">{segment.transcript}</span>
                </div>
              ))}
            </article>
          )}
          {(!hasTranscriptSegments && meetingNoteStatus) && (
            <Placeholder
              label="Transcript not ready yet"
              helper={statusHint(meetingNoteStatus, "transcript")}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function formatSpeakerLabel(label?: string) {
  if (!label) return "Speaker";
  return label.replace(/^spk/i, "Spk");
}

function formatSegmentTime(value?: string) {
  if (typeof value === "undefined") return "0.00";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric.toFixed(2);
  }
  return value;
}

function normalizeMeetingSummaryPayload(payload: unknown): MeetingSummary | null {
  if (payload == null) return null;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeMeetingSummaryPayload(parsed);
    } catch {
      return {
        summary: trimmed,
        key_insights: [],
        action_items: [],
      };
    }
  }

  if (typeof payload !== "object") {
    return null;
  }

  const raw = payload as Record<string, unknown>;

  const summaryText =
    typeof raw.summary === "string"
      ? raw.summary
      : typeof raw.rawText === "string"
      ? raw.rawText
      : "";

  const keyInsights = Array.isArray(raw.key_insights)
    ? raw.key_insights
        .map((entry) => normalizeKeyInsight(entry))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const actionItems = Array.isArray(raw.action_items)
    ? raw.action_items
        .map((entry) => normalizeActionItem(entry))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  if (!summaryText && keyInsights.length === 0 && actionItems.length === 0) {
    return null;
  }

  return {
    summary: summaryText,
    key_insights: keyInsights,
    action_items: actionItems,
  };
}

function normalizeKeyInsight(
  entry: unknown,
): MeetingSummary["key_insights"][number] | null {
  if (!entry || typeof entry !== "object") return null;
  const raw = entry as Record<string, unknown>;
  const headline = typeof raw.headline === "string" ? raw.headline : "";
  const detail = typeof raw.detail === "string" ? raw.detail : "";
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.filter((value): value is string => typeof value === "string")
    : [];

  if (!headline && !detail && evidence.length === 0) {
    return null;
  }

  return {
    headline,
    detail,
    evidence,
  };
}

function normalizeActionItem(
  entry: unknown,
): MeetingSummary["action_items"][number] | null {
  if (!entry || typeof entry !== "object") return null;
  const raw = entry as Record<string, unknown>;

  const task = typeof raw.task === "string" ? raw.task : "";
  if (!task) return null;

  const assignee = typeof raw.assignee === "string" ? raw.assignee : "";
  const dueValue = raw.due_date;
  const due_date =
    typeof dueValue === "string" || dueValue === null ? dueValue : null;

  const priorityValue = typeof raw.priority === "string" ? raw.priority : null;
  const priority =
    priorityValue === "P0" || priorityValue === "P1" || priorityValue === "P2"
      ? priorityValue
      : null;

  const confidenceValue = typeof raw.confidence === "number" ? raw.confidence : 0;
  const confidence = Math.min(Math.max(confidenceValue, 0), 1);

  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.filter((value): value is string => typeof value === "string")
    : [];

  return {
    assignee,
    task,
    due_date,
    priority,
    confidence,
    evidence,
  };
}

function formatDueDate(value: string | null | undefined) {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

function formatPriority(
  value: MeetingSummary["action_items"][number]["priority"],
) {
  if (!value) return "None";
  return value;
}

function formatConfidence(value: number | undefined) {
  if (typeof value !== "number") return "N/A";
  return `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}%`;
}

function StatusPill({ status }: { status: NotesStatus }) {
  return <span className={`status-pill status-${status.toLowerCase()}`}>{pretty(status)}</span>;
}

function pretty(s: string) {
  return s.toLowerCase().replace(/_/g, " ");
}

function fmtDate(iso: string) {
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

function statusHint(status: NotesStatus, section: "summary" | "transcript") {
  // Friendly hints depending on pipeline stage
  const map: Record<NotesStatus, string> = {
    NONE: "No audio yet. Upload or record to generate notes.",
    RECORDING: "Recording in progress…",
    RECORDED: "Audio captured. Starting transcription shortly…",
    TRANSCRIBED:
      section === "summary"
        ? "Transcript is ready. Summarizing now…"
        : "Transcript is generating/ready. Try refreshing soon.",
    SUMMARIZED:
      section === "summary"
        ? "Summary is ready, but content hasn't arrived yet. Try a refresh."
        : "Summary is ready. Transcript should be visible soon.",
    FAILED: "Processing failed. You can re-upload audio to retry.",
  };
  return map[status] ?? "Preparing your meeting…";
}

function Placeholder({ label, helper }: { label: string; helper?: string }) {
  return (
    <div className="placeholder">
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-80" />
      <div className="skeleton-line w-50" />
      <p className="muted small">{label}{helper ? ` — ${helper}` : ""}</p>
    </div>
  );
}
